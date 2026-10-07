import { storageService, subscribeToStore } from './storage';
import { 
  User, 
  Branch, 
  Court, 
  Institution, 
  Client, 
  Consultation, 
  Matter, 
  CaseRecord, 
  CaseAssignment, 
  CourtDiaryEntry, 
  Task, 
  Property, 
  Tenant, 
  Tenancy, 
  QuitNotice, 
  Invoice, 
  PaymentRecord, 
  StudentProfile, 
  LegalResearch, 
  DocumentRecord, 
  PublicNotice, 
  AuditLog, 
  ApprovalRequest, 
  WebsiteContent 
} from '../types';

export interface D1Config {
  accountId: string;
  databaseId: string;
  apiToken: string;
  customEndpoint?: string; // e.g. custom Cloudflare Worker proxy or /api/d1/query
  autoSync: boolean;
  lastSyncAt: string | null;
}

export interface D1QueryMeta {
  changed_db?: boolean;
  changes?: number;
  duration?: number;
  last_row_id?: number;
  rows_read?: number;
  rows_written?: number;
}

export interface D1QueryResult<T = any> {
  success: boolean;
  results: T[];
  meta?: D1QueryMeta;
  error?: string;
}

export interface D1TableSummary {
  tableName: string;
  category: string;
  recordCount: number;
  status: 'Ready' | 'Synced' | 'Pending';
}

const D1_CONFIG_STORAGE_KEY = 'bb_cloudflare_d1_config_v1';

// Default configuration attempting to read Vite env if defined
const getDefaultConfig = (): D1Config => {
  const envAccountId = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CLOUDFLARE_ACCOUNT_ID) || '';
  const envDatabaseId = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CLOUDFLARE_D1_DATABASE_ID) || '';
  const envApiToken = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CLOUDFLARE_API_TOKEN) || '';

  try {
    const raw = localStorage.getItem(D1_CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        accountId: parsed.accountId || envAccountId,
        databaseId: parsed.databaseId || envDatabaseId,
        apiToken: parsed.apiToken || envApiToken,
        customEndpoint: parsed.customEndpoint || '',
        autoSync: parsed.autoSync ?? false,
        lastSyncAt: parsed.lastSyncAt || null
      };
    }
  } catch (err) {
    console.error('Failed reading D1 config from storage:', err);
  }

  return {
    accountId: envAccountId,
    databaseId: envDatabaseId,
    apiToken: envApiToken,
    customEndpoint: '',
    autoSync: false,
    lastSyncAt: null
  };
};

class CloudflareD1Service {
  private config: D1Config = getDefaultConfig();
  private isReplicating: boolean = false;

  constructor() {
    this.config = getDefaultConfig();
  }

  public getConfig(): D1Config {
    return { ...this.config };
  }

  public saveConfig(newConfig: Partial<D1Config>): D1Config {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(D1_CONFIG_STORAGE_KEY, JSON.stringify(this.config));
    } catch (err) {
      console.error('Failed saving D1 config:', err);
    }
    return { ...this.config };
  }

  public isConfigured(): boolean {
    return Boolean(
      (this.config.customEndpoint && this.config.customEndpoint.trim()) ||
      (this.config.accountId && this.config.databaseId && this.config.apiToken)
    );
  }

  public getEffectiveApiUrl(): string {
    if (this.config.customEndpoint && this.config.customEndpoint.trim()) {
      return this.config.customEndpoint.trim();
    }
    // Official Cloudflare D1 REST API query endpoint
    return `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/d1/database/${this.config.databaseId}/query`;
  }

  /**
   * Execute an SQL statement against Cloudflare D1 via REST API or local proxy
   */
  public async query<T = any>(sql: string, params: any[] = []): Promise<D1QueryResult<T>> {
    const endpoint = this.getEffectiveApiUrl();
    const token = this.config.apiToken;

    // Check if we should route via Vite server-side proxy to avoid CORS in dev
    const isDirectCloudflare = endpoint.includes('api.cloudflare.com');
    const proxyUrl = '/api/d1/query';

    // Attempt through local proxy first if direct Cloudflare API is targeted
    const targetUrl = isDirectCloudflare ? proxyUrl : endpoint;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (token && !isDirectCloudflare) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const bodyPayload = isDirectCloudflare
        ? {
            sql,
            params,
            accountId: this.config.accountId,
            databaseId: this.config.databaseId,
            apiToken: this.config.apiToken
          }
        : {
            sql,
            params
          };

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload)
      });

      if (!response.ok) {
        // Fallback: If proxy is not reachable, attempt direct request
        if (targetUrl === proxyUrl && isDirectCloudflare) {
          return await this.directCloudflareQuery<T>(sql, params);
        }
        const errorText = await response.text();
        return {
          success: false,
          results: [],
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const json = await response.json();

      // Cloudflare API standard format: { result: [ { results: [...], meta: {...}, success: true } ], success: true }
      if (json.result && Array.isArray(json.result) && json.result.length > 0) {
        const firstResult = json.result[0];
        return {
          success: json.success ?? firstResult.success ?? true,
          results: firstResult.results || [],
          meta: firstResult.meta
        };
      }

      // If response is direct { success, results, meta }
      if (json.results !== undefined) {
        return {
          success: json.success ?? true,
          results: json.results || [],
          meta: json.meta
        };
      }

      return {
        success: json.success ?? true,
        results: Array.isArray(json) ? json : [],
        meta: json.meta
      };
    } catch (err: any) {
      // In case local proxy is unavailable, try direct fetch
      if (targetUrl === proxyUrl && isDirectCloudflare) {
        return await this.directCloudflareQuery<T>(sql, params);
      }

      return {
        success: false,
        results: [],
        error: err.message || 'Network error querying Cloudflare D1'
      };
    }
  }

  /**
   * Direct fetch to Cloudflare API (with CORS awareness)
   */
  private async directCloudflareQuery<T = any>(sql: string, params: any[] = []): Promise<D1QueryResult<T>> {
    try {
      const url = `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/d1/database/${this.config.databaseId}/query`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiToken}`
        },
        body: JSON.stringify({ sql, params })
      });

      if (!response.ok) {
        const text = await response.text();
        return { success: false, results: [], error: `Cloudflare API ${response.status}: ${text}` };
      }

      const json = await response.json();
      if (json.result && Array.isArray(json.result) && json.result.length > 0) {
        return {
          success: json.success ?? true,
          results: json.result[0].results || [],
          meta: json.result[0].meta
        };
      }

      return { success: json.success ?? true, results: json.results || [] };
    } catch (err: any) {
      return {
        success: false,
        results: [],
        error: `Direct connection failed (${err.message}). Consider configuring an API proxy or verifying credentials.`
      };
    }
  }

  /**
   * Test active connection to Cloudflare D1
   */
  public async testConnection(): Promise<{ success: boolean; message: string; timestamp?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Cloudflare D1 is not configured. Please supply Account ID, Database ID, and API Token.'
      };
    }

    const testSql = "SELECT 1 as ping, datetime('now') as server_time, sqlite_version() as sqlite_ver;";
    const res = await this.query(testSql);

    if (res.success && res.results && res.results.length > 0) {
      const row = res.results[0];
      return {
        success: true,
        message: `Successfully connected to Cloudflare D1! SQLite version: ${row.sqlite_ver || '3.x'}, Server time: ${row.server_time || new Date().toISOString()}`,
        timestamp: row.server_time || new Date().toISOString()
      };
    }

    return {
      success: false,
      message: res.error || 'Connection test failed. Verify Cloudflare Account ID, D1 Database ID, and Token permissions (D1:Edit).'
    };
  }

  /**
   * Deploy all initial tables and indexes into Cloudflare D1
   */
  public async initSchema(): Promise<{ success: boolean; appliedTables: number; error?: string }> {
    const ddlStatements = [
      // Branches
      `CREATE TABLE IF NOT EXISTS branches (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        head_of_chamber_id TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );`,

      // Users & Personnel
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL,
        role TEXT NOT NULL,
        branch_id TEXT NOT NULL,
        title TEXT NOT NULL,
        practice_areas TEXT NOT NULL DEFAULT '[]',
        bio TEXT NOT NULL DEFAULT '',
        photo_url TEXT NOT NULL DEFAULT '',
        availability TEXT NOT NULL DEFAULT 'AVAILABLE',
        is_publicly_visible INTEGER NOT NULL DEFAULT 1,
        is_active INTEGER NOT NULL DEFAULT 1,
        account_status TEXT NOT NULL DEFAULT 'Active',
        password_hash TEXT NOT NULL DEFAULT '',
        salt TEXT NOT NULL DEFAULT '',
        requires_password_change INTEGER NOT NULL DEFAULT 1,
        failed_login_attempts INTEGER NOT NULL DEFAULT 0,
        last_login TEXT,
        password_changed_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );`,

      // Courts
      `CREATE TABLE IF NOT EXISTS courts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        court_type TEXT NOT NULL,
        state TEXT NOT NULL,
        judicial_division TEXT NOT NULL,
        location TEXT NOT NULL,
        default_judge TEXT
      );`,

      // Partner Institutions
      `CREATE TABLE IF NOT EXISTS partner_institutions (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        address TEXT NOT NULL,
        state TEXT NOT NULL,
        contact_person TEXT NOT NULL,
        official_email TEXT NOT NULL,
        phone TEXT NOT NULL,
        relationship_status TEXT NOT NULL DEFAULT 'Active Partner',
        notes TEXT
      );`,

      // Clients
      `CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        organization TEXT,
        client_type TEXT NOT NULL DEFAULT 'Individual',
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        address TEXT NOT NULL,
        state TEXT NOT NULL,
        lga TEXT NOT NULL,
        identification_type TEXT,
        identification_number TEXT,
        branch_id TEXT NOT NULL,
        assigned_lawyer_id TEXT,
        conflict_check_status TEXT NOT NULL DEFAULT 'Passed',
        conflict_check_notes TEXT,
        conflict_reviewed_by TEXT,
        date_registered TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        confidential_notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );`,

      // Consultations
      `CREATE TABLE IF NOT EXISTS consultations (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        service_category TEXT NOT NULL,
        preferred_date TEXT NOT NULL,
        preferred_time TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        method TEXT NOT NULL,
        brief_enquiry TEXT NOT NULL,
        supporting_documents TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'Awaiting Payment',
        invoice_number TEXT NOT NULL,
        payment_reference TEXT NOT NULL,
        branch_id TEXT NOT NULL,
        assigned_lawyer_id TEXT,
        client_visible_update TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );`,

      // Matters
      `CREATE TABLE IF NOT EXISTS matters (
        id TEXT PRIMARY KEY,
        matter_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        client_id TEXT NOT NULL,
        branch_id TEXT NOT NULL,
        lead_counsel_id TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Active',
        stage TEXT NOT NULL DEFAULT 'Pleadings Preparation',
        engagement_date TEXT NOT NULL,
        client_visible_update TEXT NOT NULL DEFAULT '',
        privileged_internal_notes TEXT NOT NULL DEFAULT '',
        requires_principal_approval INTEGER NOT NULL DEFAULT 0,
        principal_approval_status TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );`,

      // Cases
      `CREATE TABLE IF NOT EXISTS cases (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL UNIQUE,
        suit_number TEXT NOT NULL UNIQUE,
        matter_id TEXT NOT NULL,
        client_id TEXT NOT NULL,
        branch_id TEXT,
        court_id TEXT NOT NULL,
        judicial_division TEXT NOT NULL,
        judge TEXT,
        counsel_id TEXT NOT NULL,
        opposing_party TEXT NOT NULL,
        opposing_counsel TEXT,
        case_type TEXT NOT NULL,
        subject_matter TEXT NOT NULL,
        filing_date TEXT NOT NULL,
        next_court_date TEXT,
        status TEXT NOT NULL DEFAULT 'Hearing',
        client_visible_update TEXT NOT NULL DEFAULT '',
        internal_strategy_notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );`,

      // Case Assignments
      `CREATE TABLE IF NOT EXISTS case_assignments (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        suit_number TEXT NOT NULL,
        branch_id TEXT,
        counsel_id TEXT NOT NULL,
        assigned_by_id TEXT NOT NULL,
        assigned_by_name TEXT NOT NULL,
        date_assigned TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        rejection_reason TEXT,
        rejection_notes TEXT,
        response_date TEXT
      );`,

      // Court Diary
      `CREATE TABLE IF NOT EXISTS court_diary (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        suit_number TEXT NOT NULL,
        branch_id TEXT,
        court_date TEXT NOT NULL,
        court_time TEXT,
        court_name TEXT NOT NULL,
        counsel_id TEXT NOT NULL,
        client_id TEXT NOT NULL,
        purpose TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Scheduled',
        outcome_summary TEXT,
        next_court_date TEXT,
        notes TEXT
      );`,

      // Tasks
      `CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        assigned_to_id TEXT NOT NULL,
        assigned_by_id TEXT NOT NULL,
        branch_id TEXT,
        matter_id TEXT,
        case_id TEXT,
        priority TEXT NOT NULL DEFAULT 'Medium',
        due_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending',
        completion_date TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );`,

      // Properties
      `CREATE TABLE IF NOT EXISTS properties (
        id TEXT PRIMARY KEY,
        property_id TEXT NOT NULL UNIQUE,
        branch_id TEXT,
        name TEXT NOT NULL,
        property_type TEXT NOT NULL,
        address TEXT NOT NULL,
        state TEXT NOT NULL,
        lga TEXT NOT NULL,
        district TEXT NOT NULL,
        landlord_id TEXT NOT NULL,
        total_units INTEGER NOT NULL DEFAULT 1,
        title_information TEXT NOT NULL DEFAULT '',
        survey_information TEXT NOT NULL DEFAULT '',
        legal_status TEXT NOT NULL DEFAULT 'Managed by Chambers',
        assigned_lawyer_id TEXT NOT NULL,
        related_client_id TEXT,
        related_matter_id TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );`,

      // Landlords
      `CREATE TABLE IF NOT EXISTS landlords (
        id TEXT PRIMARY KEY,
        landlord_id TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        address TEXT NOT NULL,
        bank_details TEXT,
        tracking_code TEXT NOT NULL UNIQUE,
        date_registered TEXT NOT NULL
      );`,

      // Tenants
      `CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        landlord_id TEXT NOT NULL,
        property_id TEXT NOT NULL,
        unit_number TEXT NOT NULL,
        tracking_code TEXT NOT NULL UNIQUE,
        occupation TEXT,
        status TEXT NOT NULL DEFAULT 'Active',
        date_registered TEXT NOT NULL
      );`,

      // Tenancies
      `CREATE TABLE IF NOT EXISTS tenancies (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        property_id TEXT NOT NULL,
        unit_number TEXT NOT NULL,
        rent_amount REAL NOT NULL,
        start_date TEXT NOT NULL,
        expiry_date TEXT NOT NULL,
        payment_frequency TEXT NOT NULL DEFAULT 'Annual',
        status TEXT NOT NULL DEFAULT 'Active',
        arrears_amount REAL NOT NULL DEFAULT 0,
        tenancy_agreement_doc_id TEXT
      );`,

      // Invoices
      `CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        invoice_number TEXT NOT NULL UNIQUE,
        client_id TEXT,
        client_name TEXT NOT NULL,
        client_email TEXT NOT NULL,
        client_phone TEXT NOT NULL,
        matter_id TEXT,
        branch_id TEXT,
        consultation_id TEXT,
        consultation_code TEXT,
        items TEXT NOT NULL DEFAULT '[]',
        subtotal REAL NOT NULL,
        tax_amount REAL NOT NULL DEFAULT 0,
        total_amount REAL NOT NULL,
        date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        payment_status TEXT NOT NULL DEFAULT 'UNPAID',
        approval_status TEXT DEFAULT 'NONE',
        approval_request_id TEXT,
        approval_notes TEXT,
        payment_reference TEXT NOT NULL UNIQUE,
        payment_method TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );`,

      // Payments
      `CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        payment_reference TEXT NOT NULL UNIQUE,
        invoice_number TEXT NOT NULL,
        client_name TEXT NOT NULL,
        amount REAL NOT NULL,
        branch_id TEXT,
        payment_method TEXT NOT NULL,
        payment_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PAYMENT_SUBMITTED',
        bank_transaction_ref TEXT,
        receipt_number TEXT,
        verified_by_id TEXT,
        verified_by_name TEXT,
        verification_date TEXT,
        verification_notes TEXT,
        proof_document_url TEXT,
        submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
      );`,

      // Students
      `CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        gender TEXT,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        institution_id TEXT NOT NULL,
        institution_name TEXT NOT NULL,
        faculty TEXT NOT NULL,
        programme TEXT NOT NULL,
        level TEXT NOT NULL,
        matric_number TEXT NOT NULL,
        placement_type TEXT NOT NULL DEFAULT 'Institution-Referred',
        placement_start_date TEXT NOT NULL,
        placement_end_date TEXT NOT NULL,
        assigned_branch_id TEXT NOT NULL,
        supervising_counsel_id TEXT NOT NULL,
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        status TEXT NOT NULL DEFAULT 'Application Received',
        completion_letter_issued INTEGER NOT NULL DEFAULT 0,
        certificate_number TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );`,

      // Documents
      `CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        branch_id TEXT,
        category TEXT NOT NULL,
        entity_type TEXT,
        entity_id TEXT,
        file_url TEXT,
        file_size TEXT,
        file_type TEXT,
        uploaded_by_id TEXT NOT NULL,
        uploaded_by_name TEXT NOT NULL,
        version TEXT NOT NULL DEFAULT '1.0',
        upload_date TEXT NOT NULL,
        is_client_visible INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        google_drive_link TEXT
      );`,

      // Public Notices
      `CREATE TABLE IF NOT EXISTS public_notices (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        content TEXT NOT NULL,
        publish_date TEXT NOT NULL,
        expiry_date TEXT,
        status TEXT NOT NULL DEFAULT 'Published',
        published_by_id TEXT NOT NULL,
        published_by_name TEXT NOT NULL
      );`,

      // Audit Logs
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_role TEXT NOT NULL,
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        details TEXT NOT NULL
      );`,

      // Website Content (CMS)
      `CREATE TABLE IF NOT EXISTS website_content (
        id TEXT PRIMARY KEY DEFAULT 'cms-main',
        tagline TEXT NOT NULL,
        hero_headline TEXT NOT NULL,
        hero_subheadline TEXT NOT NULL,
        about_story TEXT NOT NULL,
        about_founding_year TEXT NOT NULL,
        office_hours_text TEXT NOT NULL,
        emergency_hotline TEXT NOT NULL,
        consultation_fee_standard REAL NOT NULL,
        internship_policy_notice TEXT NOT NULL,
        recovery_of_premises_notice TEXT NOT NULL,
        invoice_bank_name TEXT NOT NULL,
        invoice_account_name TEXT NOT NULL,
        invoice_account_number TEXT NOT NULL,
        invoice_payment_method TEXT NOT NULL,
        last_updated TEXT NOT NULL,
        updated_by TEXT NOT NULL
      );`
    ];

    let applied = 0;
    for (const sql of ddlStatements) {
      const res = await this.query(sql);
      if (!res.success) {
        return { success: false, appliedTables: applied, error: res.error };
      }
      applied++;
    }

    return { success: true, appliedTables: applied };
  }

  /**
   * Export all existing local data from storage into Cloudflare D1
   */
  public async exportAllToD1(): Promise<{ success: boolean; recordsExported: number; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, recordsExported: 0, error: 'Cloudflare D1 is not configured.' };
    }

    // Ensure schema is applied
    const initRes = await this.initSchema();
    if (!initRes.success) {
      return { success: false, recordsExported: 0, error: `Schema initialization failed: ${initRes.error}` };
    }

    let exported = 0;

    try {
      // 1. Export Branches
      const branches = storageService.getBranches();
      for (const b of branches) {
        await this.query(
          `INSERT INTO branches (id, name, code, address, city, state, phone, email, head_of_chamber_id, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET name=excluded.name, address=excluded.address, phone=excluded.phone, email=excluded.email;`,
          [b.id, b.name, b.code, b.address, b.city, b.state, b.phone, b.email, b.headOfChamberId || null, b.isActive ? 1 : 0]
        );
        exported++;
      }

      // 2. Export Users
      const users = storageService.getUsers();
      for (const u of users) {
        await this.query(
          `INSERT INTO users (id, username, name, email, phone, role, branch_id, title, practice_areas, bio, photo_url, availability, is_publicly_visible, is_active, account_status, password_hash, salt, requires_password_change)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET 
             username=excluded.username, name=excluded.name, email=excluded.email, title=excluded.title, 
             availability=excluded.availability, is_publicly_visible=excluded.is_publicly_visible, 
             password_hash=excluded.password_hash, requires_password_change=excluded.requires_password_change;`,
          [
            u.id, u.username, u.name, u.email, u.phone, u.role, u.branchId, u.title,
            JSON.stringify(u.practiceAreas || []), u.bio || '', u.photoUrl || '', u.availability,
            u.isPubliclyVisible ? 1 : 0, u.isActive ? 1 : 0, u.accountStatus, u.passwordHash, u.salt,
            u.requiresPasswordChange ? 1 : 0
          ]
        );
        exported++;
      }

      // 3. Export Clients
      const clients = storageService.getClients();
      for (const c of clients) {
        await this.query(
          `INSERT INTO clients (id, client_id, full_name, organization, client_type, phone, email, address, state, lga, branch_id, assigned_lawyer_id, date_registered, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET full_name=excluded.full_name, phone=excluded.phone, email=excluded.email;`,
          [
            c.id, c.clientId, c.fullName, c.organization || null, c.clientType, c.phone, c.email,
            c.address, c.state, c.lga, c.branchId, c.assignedLawyerId || null, c.dateRegistered, c.isActive ? 1 : 0
          ]
        );
        exported++;
      }

      // 4. Export Consultations
      const consultations = storageService.getConsultations();
      for (const cons of consultations) {
        await this.query(
          `INSERT INTO consultations (id, code, service_category, preferred_date, preferred_time, full_name, phone, email, method, brief_enquiry, supporting_documents, status, invoice_number, payment_reference, branch_id, client_visible_update, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET status=excluded.status, client_visible_update=excluded.client_visible_update;`,
          [
            cons.id, cons.code, cons.serviceCategory, cons.preferredDate, cons.preferredTime, cons.fullName,
            cons.phone, cons.email, cons.method, cons.briefEnquiry, JSON.stringify(cons.supportingDocuments || []),
            cons.status, cons.invoiceNumber, cons.paymentReference, cons.branchId, cons.clientVisibleUpdate || '', cons.createdAt
          ]
        );
        exported++;
      }

      // 5. Export Matters
      const matters = storageService.getMatters();
      for (const m of matters) {
        await this.query(
          `INSERT INTO matters (id, matter_id, title, client_id, branch_id, lead_counsel_id, category, status, stage, engagement_date, client_visible_update, privileged_internal_notes, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET title=excluded.title, status=excluded.status, stage=excluded.stage, client_visible_update=excluded.client_visible_update;`,
          [
            m.id, m.matterId, m.title, m.clientId, m.branchId, m.leadCounselId, m.category,
            m.status, m.stage, m.engagementDate, m.clientVisibleUpdate, m.privilegedInternalNotes, m.createdAt
          ]
        );
        exported++;
      }

      // 6. Export Cases
      const cases = storageService.getCases();
      for (const cs of cases) {
        await this.query(
          `INSERT INTO cases (id, case_id, suit_number, matter_id, client_id, branch_id, court_id, judicial_division, judge, counsel_id, opposing_party, case_type, subject_matter, filing_date, status, client_visible_update, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET suit_number=excluded.suit_number, status=excluded.status, client_visible_update=excluded.client_visible_update;`,
          [
            cs.id, cs.caseId, cs.suitNumber, cs.matterId, cs.clientId, cs.branchId || null, cs.courtId,
            cs.judicialDivision, cs.judge || null, cs.counselId, cs.opposingParty, cs.caseType, cs.subjectMatter,
            cs.filingDate, cs.status, cs.clientVisibleUpdate, cs.createdAt
          ]
        );
        exported++;
      }

      // 7. Export Invoices
      const invoices = storageService.getInvoices();
      for (const inv of invoices) {
        await this.query(
          `INSERT INTO invoices (id, invoice_number, client_id, client_name, client_email, client_phone, matter_id, branch_id, consultation_code, items, subtotal, total_amount, date, due_date, payment_status, payment_reference)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET payment_status=excluded.payment_status;`,
          [
            inv.id, inv.invoiceNumber, inv.clientId || null, inv.clientName, inv.clientEmail, inv.clientPhone,
            inv.matterId || null, inv.branchId || null, inv.consultationCode || null, JSON.stringify(inv.items || []),
            inv.subtotal, inv.totalAmount, inv.date, inv.dueDate, inv.paymentStatus, inv.paymentReference
          ]
        );
        exported++;
      }

      // 8. Export Payments
      const payments = storageService.getPayments();
      for (const p of payments) {
        await this.query(
          `INSERT INTO payments (id, payment_reference, invoice_number, client_name, amount, payment_method, payment_date, status, bank_transaction_ref, submitted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET status=excluded.status, bank_transaction_ref=excluded.bank_transaction_ref;`,
          [
            p.id, p.paymentReference, p.invoiceNumber, p.clientName, p.amount, p.paymentMethod,
            p.paymentDate, p.status, p.bankTransactionRef || null, p.submittedAt
          ]
        );
        exported++;
      }

      // 9. Export Properties
      const properties = storageService.getProperties();
      for (const prop of properties) {
        await this.query(
          `INSERT INTO properties (id, property_id, name, property_type, address, state, lga, district, landlord_id, total_units, title_information, legal_status, assigned_lawyer_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET name=excluded.name, legal_status=excluded.legal_status;`,
          [
            prop.id, prop.propertyId, prop.name, prop.propertyType, prop.address, prop.state, prop.lga,
            prop.district, prop.landlordId, prop.totalUnits, prop.titleInformation, prop.legalStatus, prop.assignedLawyerId
          ]
        );
        exported++;
      }

      // 10. Export CMS Content
      const cms = storageService.getWebsiteContent();
      await this.query(
        `INSERT INTO website_content (id, tagline, hero_headline, hero_subheadline, about_story, about_founding_year, office_hours_text, emergency_hotline, consultation_fee_standard, internship_policy_notice, recovery_of_premises_notice, invoice_bank_name, invoice_account_name, invoice_account_number, invoice_payment_method, last_updated, updated_by)
         VALUES ('cms-main', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET 
           tagline=excluded.tagline, hero_headline=excluded.hero_headline, hero_subheadline=excluded.hero_subheadline, 
           consultation_fee_standard=excluded.consultation_fee_standard, emergency_hotline=excluded.emergency_hotline, 
           office_hours_text=excluded.office_hours_text, last_updated=excluded.last_updated;`,
        [
          cms.tagline, cms.heroHeadline, cms.heroSubheadline, cms.aboutStory, cms.aboutFoundingYear,
          cms.officeHoursText, cms.emergencyHotline, cms.consultationFeeStandard, cms.internshipPolicyNotice,
          cms.recoveryOfPremisesNotice, cms.invoiceBankName, cms.invoiceAccountName, cms.invoiceAccountNumber,
          cms.invoicePaymentMethod, new Date().toISOString(), 'Cloudflare D1 Exporter'
        ]
      );
      exported++;

      this.saveConfig({ lastSyncAt: new Date().toISOString() });
      return { success: true, recordsExported: exported };
    } catch (err: any) {
      return { success: false, recordsExported: exported, error: err.message };
    }
  }

  /**
   * Pull records from Cloudflare D1 and hydrate into local storageService
   */
  public async importAllFromD1(): Promise<{ success: boolean; tablesImported: number; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, tablesImported: 0, error: 'Cloudflare D1 is not configured.' };
    }

    let tables = 0;

    try {
      // 1. Fetch Users from D1
      const usersRes = await this.query('SELECT * FROM users ORDER BY created_at ASC;');
      if (usersRes.success && usersRes.results.length > 0) {
        const d1Users: User[] = usersRes.results.map((r: any) => ({
          id: r.id,
          username: r.username,
          name: r.name,
          email: r.email,
          phone: r.phone,
          role: r.role,
          branchId: r.branch_id,
          title: r.title,
          practiceAreas: typeof r.practice_areas === 'string' ? JSON.parse(r.practice_areas) : r.practice_areas || [],
          bio: r.bio || '',
          photoUrl: r.photo_url || '',
          availability: r.availability,
          isPubliclyVisible: Boolean(r.is_publicly_visible),
          isActive: Boolean(r.is_active),
          accountStatus: r.account_status,
          passwordHash: r.password_hash || '',
          salt: r.salt || '',
          requiresPasswordChange: Boolean(r.requires_password_change),
          failedLoginAttempts: r.failed_login_attempts || 0,
          createdAt: r.created_at
        }));

        if (d1Users.length > 0) {
          // Merge with local users
          const existing = storageService.getUsers();
          const merged = [...d1Users];
          existing.forEach(localU => {
            if (!merged.some(m => m.id === localU.id)) {
              merged.push(localU);
            }
          });
          localStorage.setItem('bb_users_v1', JSON.stringify(merged));
          tables++;
        }
      }

      // 2. Fetch CMS content
      const cmsRes = await this.query('SELECT * FROM website_content WHERE id = ?;', ['cms-main']);
      if (cmsRes.success && cmsRes.results.length > 0) {
        const r = cmsRes.results[0];
        const cmsData: Partial<WebsiteContent> = {
          tagline: r.tagline,
          heroHeadline: r.hero_headline,
          heroSubheadline: r.hero_subheadline,
          aboutStory: r.about_story,
          aboutFoundingYear: r.about_founding_year,
          officeHoursText: r.office_hours_text,
          emergencyHotline: r.emergency_hotline,
          consultationFeeStandard: Number(r.consultation_fee_standard),
          invoiceBankName: r.invoice_bank_name,
          invoiceAccountName: r.invoice_account_name,
          invoiceAccountNumber: r.invoice_account_number,
          invoicePaymentMethod: r.invoice_payment_method
        };
        const current = storageService.getWebsiteContent();
        localStorage.setItem('bb_website_content_v1', JSON.stringify({ ...current, ...cmsData }));
        tables++;
      }

      this.saveConfig({ lastSyncAt: new Date().toISOString() });
      return { success: true, tablesImported: tables };
    } catch (err: any) {
      return { success: false, tablesImported: tables, error: err.message };
    }
  }

  /**
   * Get table summary and statistics from local state and D1
   */
  public getTableSummaries(): D1TableSummary[] {
    return [
      { tableName: 'branches', category: 'Chambers Hierarchy', recordCount: storageService.getBranches().length, status: 'Ready' },
      { tableName: 'users', category: 'Personnel & Counsel', recordCount: storageService.getUsers().length, status: 'Ready' },
      { tableName: 'clients', category: 'Client Intake', recordCount: storageService.getClients().length, status: 'Ready' },
      { tableName: 'consultations', category: 'Public Bookings', recordCount: storageService.getConsultations().length, status: 'Ready' },
      { tableName: 'matters', category: 'Legal Matters', recordCount: storageService.getMatters().length, status: 'Ready' },
      { tableName: 'cases', category: 'Litigation Dockets', recordCount: storageService.getCases().length, status: 'Ready' },
      { tableName: 'court_diary', category: 'Cause List & Fixtures', recordCount: storageService.getCourtDiary().length, status: 'Ready' },
      { tableName: 'tasks', category: 'Workflow & Deadlines', recordCount: storageService.getTasks().length, status: 'Ready' },
      { tableName: 'properties', category: 'Real Estate & Tenancy', recordCount: storageService.getProperties().length, status: 'Ready' },
      { tableName: 'tenants', category: 'Tenant Registry', recordCount: storageService.getTenants().length, status: 'Ready' },
      { tableName: 'tenancies', category: 'Tenancy Agreements', recordCount: storageService.getTenancies().length, status: 'Ready' },
      { tableName: 'invoices', category: 'Billing & Accounting', recordCount: storageService.getInvoices().length, status: 'Ready' },
      { tableName: 'payments', category: 'Financial Verification', recordCount: storageService.getPayments().length, status: 'Ready' },
      { tableName: 'students', category: 'Law Student Placements', recordCount: storageService.getStudents().length, status: 'Ready' },
      { tableName: 'documents', category: 'Document Repository', recordCount: storageService.getDocuments().length, status: 'Ready' },
      { tableName: 'legal_research', category: 'Precedents & Research', recordCount: storageService.getLegalResearch().length, status: 'Ready' },
      { tableName: 'public_notices', category: 'Public Communications', recordCount: storageService.getPublicNotices().length, status: 'Ready' },
      { tableName: 'audit_logs', category: 'Security & Governance', recordCount: storageService.getAuditLogs().length, status: 'Ready' },
      { tableName: 'website_content', category: 'Dynamic CMS', recordCount: 1, status: 'Ready' }
    ];
  }

  /**
   * Background replication hook: fires whenever data changes if autoSync is active
   */
  public async replicateMutation(entityType: string, action: string, data: any): Promise<void> {
    if (!this.config.autoSync || !this.isConfigured() || this.isReplicating) {
      return;
    }

    try {
      this.isReplicating = true;
      if (entityType === 'Counsel' || entityType === 'User') {
        const u = data as User;
        if (u && u.id) {
          await this.query(
            `INSERT INTO users (id, username, name, email, phone, role, branch_id, title, availability, is_publicly_visible)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET availability=excluded.availability, is_publicly_visible=excluded.is_publicly_visible;`,
            [u.id, u.username, u.name, u.email, u.phone, u.role, u.branchId, u.title, u.availability, u.isPubliclyVisible ? 1 : 0]
          );
        }
      }
    } catch (e) {
      console.warn('D1 auto-replication skipped non-blocking error:', e);
    } finally {
      this.isReplicating = false;
    }
  }
}

export const d1Service = new CloudflareD1Service();
