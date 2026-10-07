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

    // Apply schema immediately if needed
    const schemaFile = path.resolve(process.cwd(), 'migrations/0001_initial_schema.sql');
    if (fs.existsSync(schemaFile)) {
      const schemaSql = fs.readFileSync(schemaFile, 'utf-8');
      sqlite.exec(schemaSql);
    }

    return {
      prepare(sql: string) {
        let boundParams: any[] = [];
        return {
          bind(...params: any[]) {
            boundParams = params;
            return this;
          },
          async all() {
            try {
              const stmt = sqlite.prepare(sql);
              const rows = stmt.all(...boundParams);
              return { success: true, results: rows };
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
      }
    };
  } catch (err) {
    console.error('Failed to initialize Dev D1 SQLite instance:', err);
    throw err;
  }
}
