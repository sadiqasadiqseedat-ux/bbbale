/**
 * Development D1 Adapter for Vite Dev Server (Node.js runtime)
 * This is ONLY loaded by Vite dev server middlewares for local testing.
 * The production Cloudflare Worker (src/worker.ts) strictly uses env.DB and NEVER imports this file.
 */

import { D1Database, D1PreparedStatement, D1Response } from '../types/worker';

export function getDevD1Database(): D1Database {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID || '349d3f2c-bc47-418b-ade9-574de9c9812b';
  const apiToken = process.env.CLOUDFLARE_API_TOKEN || '';

  // If server-side credentials are configured, connect directly to Cloudflare D1 REST API
  if (accountId && databaseId && apiToken) {
    return {
      prepare(query: string): D1PreparedStatement {
        let params: any[] = [];
        return {
          bind(...values: any[]) {
            params = values;
            return this;
          },
          async first<T = any>(colName?: string): Promise<T | null> {
            const res = await this.all<T>();
            const firstRow = res.results?.[0] as any;
            if (!firstRow) return null;
            return colName ? firstRow[colName] : firstRow;
          },
          async run<T = any>(): Promise<D1Response<T>> {
            return this.all<T>();
          },
          async all<T = any>(): Promise<D1Response<T>> {
            try {
              const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
              const res = await fetch(cfUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${apiToken}`
                },
                body: JSON.stringify({ sql: query, params })
              });
              const data = await res.json() as any;
              const d1Res = data.result?.[0] || {};
              return {
                results: (d1Res.results || []) as T[],
                success: Boolean(data.success),
                meta: d1Res.meta
              };
            } catch (err: any) {
              console.error('Cloudflare D1 REST proxy error in dev server:', err);
              return { results: [] as T[], success: false, meta: {}, error: err.message };
            }
          },
          async raw<T = any>(): Promise<T[]> {
            const res = await this.all<T>();
            return res.results.map((r: any) => Object.values(r)) as T[];
          }
        };
      },
      async dump() { return new ArrayBuffer(0); },
      async batch<T = any>(statements: D1PreparedStatement[]): Promise<D1Response<T>[]> {
        const results: D1Response<T>[] = [];
        for (const s of statements) {
          results.push(await s.run<T>());
        }
        return results;
      },
      async exec(_query: string) { return { count: 0, duration: 0 }; }
    };
  }

  // In-memory table store for local dev when external secrets are not provided
  const tables: Record<string, any[]> = {
    users: [],
    branches: [],
    clients: [],
    matters: [],
    cases: [],
    case_assignments: [],
    court_diary: [],
    tasks: [],
    properties: [],
    landlords: [],
    units: [],
    tenants: [],
    tenancies: [],
    invoices: [],
    payments: [],
    consultations: [],
    students: [],
    documents: [],
    audit_logs: [],
    user_sessions: [],
    website_content: []
  };

  return {
    prepare(query: string): D1PreparedStatement {
      let params: any[] = [];
      const cleanSql = query.trim();

      return {
        bind(...values: any[]) {
          params = values;
          return this;
        },
        async first<T = any>(colName?: string): Promise<T | null> {
          const res = await this.all<T>();
          const firstRow = res.results?.[0] as any;
          if (!firstRow) return null;
          return colName ? firstRow[colName] : firstRow;
        },
        async run<T = any>(): Promise<D1Response<T>> {
          return this.all<T>();
        },
        async all<T = any>(): Promise<D1Response<T>> {
          const lower = cleanSql.toLowerCase();

          // Handle SELECT COUNT(*)
          if (lower.startsWith('select count(*)')) {
            const match = lower.match(/from\s+([a-zA-Z0-9_]+)/);
            const tblName = match ? match[1] : '';
            const count = (tables[tblName] || []).length;
            return {
              results: [{ count }] as unknown as T[],
              success: true,
              meta: { rows_read: 1 }
            };
          }

          // Handle SELECT * FROM table
          if (lower.startsWith('select')) {
            const match = lower.match(/from\s+([a-zA-Z0-9_]+)/);
            const tblName = match ? match[1] : '';
            let rows = tables[tblName] || [];

            // Simple WHERE filtering
            if (lower.includes('where') && params.length > 0) {
              if (tblName === 'users' && lower.includes('username')) {
                const target = String(params[0]).toLowerCase();
                rows = rows.filter(r => (r.username && r.username.toLowerCase() === target) || (r.email && r.email.toLowerCase() === target) || (r.role === target));
              } else if (tblName === 'user_sessions' && lower.includes('token')) {
                rows = rows.filter(r => r.token === params[0]);
              } else if (lower.includes('id =')) {
                rows = rows.filter(r => r.id === params[0]);
              }
            }

            return {
              results: rows as unknown as T[],
              success: true,
              meta: { rows_read: rows.length }
            };
          }

          // Handle INSERT INTO table
          if (lower.startsWith('insert')) {
            const match = lower.match(/insert\s+(?:or\s+ignore\s+)?into\s+([a-zA-Z0-9_]+)/);
            const tblName = match ? match[1] : '';
            if (tables[tblName]) {
              const row: any = { id: params[0] || `row-${Date.now()}` };
              if (tblName === 'user_sessions') {
                row.token = params[0];
                row.user_id = params[1];
                row.role = params[2];
                row.branch_id = params[3];
                row.expires_at = params[4];
              } else if (tblName === 'users') {
                row.id = params[0];
                row.username = params[1];
                row.name = params[2];
                row.email = params[3];
                row.phone = params[4];
                row.role = params[5];
                row.branch_id = params[6];
                row.title = params[7];
                row.password_hash = params[params.length - 2];
                row.salt = params[params.length - 1];
                row.is_active = 1;
                row.account_status = 'Active';
              } else if (tblName === 'clients') {
                row.id = params[0];
                row.client_id = params[1];
                row.full_name = params[2];
                row.phone = params[5];
                row.email = params[6];
                row.is_active = 1;
              }
              tables[tblName].push(row);
            }
            return {
              results: [] as unknown as T[],
              success: true,
              meta: { changes: 1 }
            };
          }

          return {
            results: [] as unknown as T[],
            success: true,
            meta: {}
          };
        },
        async raw<T = any>(): Promise<T[]> {
          return [];
        }
      };
    },
    async dump() { return new ArrayBuffer(0); },
    async batch<T = any>(statements: D1PreparedStatement[]): Promise<D1Response<T>[]> {
      const results: D1Response<T>[] = [];
      for (const s of statements) {
        results.push(await s.run<T>());
      }
      return results;
    },
    async exec(_query: string) { return { count: 0, duration: 0 }; }
  };
}
