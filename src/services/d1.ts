/**
 * Cloudflare D1 Client Service
 * Communicates with server-side Cloudflare Worker / Pages Function API endpoints.
 * ZERO secrets in frontend: all D1 access is handled server-side via env.DB binding.
 */

export interface D1StatusResponse {
  success: boolean;
  connected: boolean;
  databaseBinding: string;
  totalTables: number;
  tables: string[];
  recordCounts: Record<string, number>;
  timestamp: string;
  error?: string;
}

export interface D1QueryResult<T = any> {
  success: boolean;
  results: T[];
  meta?: any;
  error?: string;
}

export interface D1TableSummary {
  tableName: string;
  category: string;
  recordCount: number;
  status: 'Ready' | 'Synced' | 'Pending';
}

class CloudflareD1Client {
  private lastStatus: D1StatusResponse | null = null;

  /**
   * Check connection and fetch real database status from Cloudflare D1 binding
   */
  public async getStatus(): Promise<D1StatusResponse> {
    try {
      const res = await fetch('/api/d1/status');
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server returned HTTP ${res.status}: ${text}`);
      }
      const data = await res.json();
      this.lastStatus = data;
      return data;
    } catch (err: any) {
      return {
        success: false,
        connected: false,
        databaseBinding: 'env.DB',
        totalTables: 0,
        tables: [],
        recordCounts: {},
        timestamp: new Date().toISOString(),
        error: err.message || 'Unable to connect to Cloudflare D1 API'
      };
    }
  }

  /**
   * Test connection to Cloudflare D1
   */
  public async testConnection(): Promise<{ success: boolean; message: string; timestamp?: string }> {
    const status = await this.getStatus();
    if (status.connected) {
      return {
        success: true,
        message: `Connected to Cloudflare D1 via env.DB. Active tables: ${status.totalTables}.`,
        timestamp: status.timestamp
      };
    }
    return {
      success: false,
      message: status.error || 'Failed to connect to Cloudflare D1.'
    };
  }

  /**
   * Execute D1 Schema verification or initial personnel seed
   */
  public async initSchema(): Promise<{ success: boolean; message: string; appliedTables?: number; error?: string }> {
    try {
      const res = await fetch('/api/d1/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        const status = await this.getStatus();
        return {
          success: true,
          message: data.message || 'Schema verified successfully.',
          appliedTables: status.totalTables
        };
      }
      return {
        success: false,
        message: data.error || 'Migration failed',
        error: data.error
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network error during migration',
        error: err.message
      };
    }
  }

  /**
   * Execute safe read-only SQL query via Server Console
   */
  public async executeSql<T = any>(sql: string): Promise<D1QueryResult<T>> {
    try {
      const res = await fetch('/api/d1/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql })
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        results: [],
        error: err.message || 'SQL execution failed'
      };
    }
  }

  /**
   * Get dynamic table summaries from last status
   */
  public getTableSummaries(): D1TableSummary[] {
    const counts = this.lastStatus?.recordCounts || {};

    const categoryMap: Record<string, string> = {
      branches: 'Chambers Directory',
      users: 'Personnel & Counsel',
      courts: 'Jurisdiction & Fixtures',
      partner_institutions: 'Institutional Partners',
      clients: 'Client Registry',
      consultations: 'Client Bookings',
      matters: 'Retainers & Matters',
      cases: 'Litigation & Cause Lists',
      case_assignments: 'Counsel Assignments',
      court_diary: 'Court Diary & Cause Lists',
      tasks: 'Chambers Workflow',
      landlords: 'Real Estate & Landlords',
      properties: 'Managed Real Estate',
      tenants: 'Tenancy Registry',
      tenancies: 'Tenancy Agreements',
      quit_notices: 'Statutory Quit Notices',
      invoices: 'Accounts & Billing',
      payments: 'Verified Receipts & Funds',
      expenses: 'Disbursements & Expenses',
      students: 'Law Student Interns',
      legal_research: 'Research & Authorities',
      documents: 'Document Repository',
      public_notices: 'Website Notice Board',
      public_enquiries: 'Public Intake',
      approval_requests: 'Executive Authorizations',
      audit_logs: 'Statutory Audit Trail',
      website_content: 'Dynamic CMS Content'
    };

    return Object.entries(categoryMap).map(([tbl, cat]) => ({
      tableName: tbl,
      category: cat,
      recordCount: counts[tbl] ?? 0,
      status: 'Ready'
    }));
  }
}

export const d1Service = new CloudflareD1Client();
