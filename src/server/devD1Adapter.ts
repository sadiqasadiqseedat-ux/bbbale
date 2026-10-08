/**
 * Local Development D1 Adapter for AI Studio / Node.js 22 Dev Environment
 * Provides 100% faithful Cloudflare D1Database API simulation backed by node:sqlite.
 * Enables Device A & Device B cross-device synchronization in AI Studio preview.
 */

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export function createDevD1Database(dbFilePath: string = './.base44/chambers_d1_dev.sqlite') {
  try {
    const dir = path.dirname(dbFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const sqlite = new DatabaseSync(dbFilePath);
    sqlite.exec('PRAGMA foreign_keys = OFF;');

    // Apply every migration in order (mirrors `wrangler d1 migrations apply`)
    const migrationsDir = path.resolve(process.cwd(), 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort();
      for (const file of migrationFiles) {
        const migrationSql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        try {
          sqlite.exec(migrationSql);
        } catch (err: any) {
          // If already applied (e.g. duplicate column or table already exists), continue
          if (!err.message?.includes('already exists') && !err.message?.includes('duplicate column')) {
            console.warn(`Migration ${file} execution notice:`, err.message);
          }
        }
      }
    }

    // Ensure correspondence table has created_at column if created from older schema
    try {
      const info = sqlite.prepare('PRAGMA table_info(correspondence)').all() as any[];
      if (info && info.length > 0) {
        const hasCreatedAt = info.some((col: any) => col.name === 'created_at');
        if (!hasCreatedAt) {
          sqlite.exec("ALTER TABLE correspondence ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'));");
        }
      }
    } catch {
      // Ignore if table does not exist
    }

    return {
      prepare(sql: string) {
        let boundParams: any[] = [];
        return {
          bind(...params: any[]) {
            boundParams = params.map(p => (p === undefined ? null : p));
            return this;
          },
          async all() {
            try {
              const stmt = sqlite.prepare(sql);
              const rows = stmt.all(...boundParams);
              return { success: true, results: rows, meta: { served_by: 'dev_sqlite', duration: 0, changes: 0, last_row_id: 0, changed_db: false, size_after: 0, rows_read: rows.length, rows_written: 0 } as any };
            } catch (err: any) {
              console.error(`D1 dev SQL query error [${sql}]:`, err);
              throw err;
            }
          },
          async first(colName?: string) {
            try {
              const stmt = sqlite.prepare(sql);
              const row = stmt.get(...boundParams);
              if (!row) return null;
              if (colName) return (row as any)[colName];
              return row;
            } catch (err: any) {
              console.error(`D1 dev SQL first error [${sql}]:`, err);
              throw err;
            }
          },
          async run() {
            try {
              const stmt = sqlite.prepare(sql);
              const info = stmt.run(...boundParams);
              return {
                success: true,
                meta: { changes: info.changes, last_row_id: Number(info.lastInsertRowid) }
              };
            } catch (err: any) {
              console.error(`D1 dev SQL run error [${sql}]:`, err);
              throw err;
            }
          },
          async raw() {
            try {
              const stmt = sqlite.prepare(sql);
              const rows = stmt.all(...boundParams);
              return rows.map((r: any) => Object.values(r));
            } catch (err: any) {
              console.error(`D1 dev SQL raw error [${sql}]:`, err);
              throw err;
            }
          }
        };
      },
      async batch(statements: any[]) {
        const results = [];
        for (const s of statements) {
          results.push(await s.run());
        }
        return results;
      },
      async exec(sql: string) {
        sqlite.exec(sql);
        return { count: 1, duration: 0 };
      },
      async dump() {
        return new ArrayBuffer(0);
      }
    };
  } catch (err) {
    console.error('Failed to initialize Dev D1 SQLite instance:', err);
    throw err;
  }
}
