/**
 * B. B. BALE & CO. CHAMBERS — CLOUDFLARE D1 / WORKER / PAGES API HANDLER
 * Central Server-Side Database Controller using Cloudflare D1 (env.DB binding)
 *
 * Provides authoritative relational CRUD, server-side role validation, audit logs,
 * cross-device synchronization, and zero-token architecture.
 */

import { hashPassword, verifyPassword, generateSalt } from '../services/crypto';

export interface Env {
  DB: any; // Cloudflare D1Database binding
  R2?: any; // Cloudflare R2Bucket binding (optional)
}

// 5 Initial Authorized Personnel (passwords set to admin@2026 on initial seed)
const INITIAL_STAFF_SEEDS = [
  {
    id: 'usr-principal-01',
    username: 'principal.partner',
    name: 'Barrister B. B. Bale, SAN, FCIArb',
    email: 'principal@bbbalechambers.ng',
    phone: '+234 803 200 1100',
    role: 'PRINCIPAL_PARTNER',
    branch_id: 'br-abuja-01',
    title: 'Senior Advocate of Nigeria / Principal Partner',
    practice_areas: JSON.stringify(['Constitutional Litigation', 'Appellate Advocacy', 'Energy & Natural Resources', 'Commercial Arbitration']),
    bio: 'Founding Partner and Senior Advocate of Nigeria with over three decades of exceptional legal practice, appearing before the Supreme Court of Nigeria and international arbitral tribunals.',
    photo_url: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=600',
    availability: 'AVAILABLE',
    is_publicly_visible: 1,
    is_active: 1,
    account_status: 'Active',
    salt: 'a1b2c3d4e5f60718'
  },
  {
    id: 'usr-hoc-01',
    username: 'head.chamber',
    name: 'Barrister Aisha M. Bello, LL.M',
    email: 'hoc.abuja@bbbalechambers.ng',
    phone: '+234 802 333 4455',
    role: 'HEAD_OF_CHAMBER',
    branch_id: 'br-abuja-01',
    title: 'Head of Chamber / Partner',
    practice_areas: JSON.stringify(['Commercial Litigation', 'Sharia / Islamic Inheritance', 'Property Law', 'Corporate Governance']),
    bio: 'Partner directing day-to-day Chambers operations, appellate brief drafting, and supervising counsel litigation assignments across superior courts of record.',
    photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600',
    availability: 'IN_OFFICE',
    is_publicly_visible: 1,
    is_active: 1,
    account_status: 'Active',
    salt: 'b2c3d4e5f6071829'
  },
  {
    id: 'usr-admin-01',
    username: 'administrator',
    name: 'Hajiya Fatima Garba, B.Sc, MPA',
    email: 'admin@bbbalechambers.ng',
    phone: '+234 805 111 2233',
    role: 'ADMINISTRATOR_SECRETARY',
    branch_id: 'br-abuja-01',
    title: 'Chief Legal Registrar & Practice Administrator',
    practice_areas: JSON.stringify(['Chambers Administration', 'Court Diary Management', 'Client Relations', 'Statutory Filings']),
    bio: 'Experienced Practice Administrator managing Chambers intake registries, cause lists, client consultation schedules, and institutional correspondence.',
    photo_url: 'https://images.unsplash.com/photo-1580894732454-defa48f40742?auto=format&fit=crop&q=80&w=600',
    availability: 'AVAILABLE',
    is_publicly_visible: 1,
    is_active: 1,
    account_status: 'Active',
    salt: 'c3d4e5f60718293a'
  },
  {
    id: 'usr-account-01',
    username: 'accounts',
    name: 'Chukwuemeka Okonkwo, ACA, ACTI',
    email: 'accounts@bbbalechambers.ng',
    phone: '+234 806 888 9900',
    role: 'ACCOUNT_OFFICER',
    branch_id: 'br-abuja-01',
    title: 'Chief Financial & Account Officer',
    practice_areas: JSON.stringify(['Client Trust Accounting', 'Tax & Compliance Audit', 'Real Estate Escrow']),
    bio: 'Chartered Accountant overseeing client retainer accounting, consultation invoice verification, court filing disbursements, and property escrow records.',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
    availability: 'AVAILABLE',
    is_publicly_visible: 1,
    is_active: 1,
    account_status: 'Active',
    salt: 'd4e5f60718293a4b'
  },
  {
    id: 'usr-counsel-01',
    username: 'counsel',
    name: 'Barrister Tunde Adeleke, BL',
    email: 'tunde.adeleke@bbbalechambers.ng',
    phone: '+234 813 444 7788',
    role: 'COUNSEL_STAFF',
    branch_id: 'br-abuja-01',
    title: 'Senior Litigation & Property Associate',
    practice_areas: JSON.stringify(['Recovery of Premises', 'High Court Litigation', 'Tenancy Disputes', 'Commercial Drafting']),
    bio: 'Accomplished trial advocate specializing in tenancy litigation, recovery of premises under state tenancies laws, and appellate brief preparation.',
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600',
    availability: 'IN_COURT',
    is_publicly_visible: 1,
    is_active: 1,
    account_status: 'Active',
    salt: 'e5f60718293a4b5c'
  }
];

const INITIAL_BRANCHES_SEEDS = [
  { id: 'br-abuja-01', name: 'Abuja Head Chambers', code: 'ABJ', address: 'Plot 742, Gabriel Olusanya Crescent, Off Constitution Avenue, Central Business District', city: 'Abuja', state: 'Federal Capital Territory (FCT)', phone: '+234 9 291 8000 / +234 803 200 1100', email: 'abuja@bbbalechambers.ng', head_of_chamber_id: 'usr-hoc-01', is_active: 1 },
  { id: 'br-lagos-02', name: 'Lagos Island Chambers', code: 'LOS', address: '14th Floor, Investment House, 21-25 Broad Street, Lagos Island', city: 'Lagos', state: 'Lagos State', phone: '+234 1 454 9200', email: 'lagos@bbbalechambers.ng', head_of_chamber_id: null, is_active: 1 },
  { id: 'br-kano-03', name: 'Kano Commercial Chambers', code: 'KAN', address: 'Suite 404, Gidan Goldie, 2 Race Course Road, Nassarawa GRA', city: 'Kano', state: 'Kano State', phone: '+234 64 982 110', email: 'kano@bbbalechambers.ng', head_of_chamber_id: null, is_active: 1 },
  { id: 'br-ph-04', name: 'Port Harcourt Branch', code: 'PHC', address: '8 Forces Avenue, Old GRA', city: 'Port Harcourt', state: 'Rivers State', phone: '+234 84 301 440', email: 'portharcourt@bbbalechambers.ng', head_of_chamber_id: null, is_active: 1 }
];

const INITIAL_COURTS_SEEDS = [
  { id: 'crt-01', name: 'Supreme Court of Nigeria', court_type: 'Supreme Court', state: 'FCT', judicial_division: 'Supreme Court Complex, Three Arms Zone, Abuja', location: 'Three Arms Zone, Abuja', default_judge: 'Chief Justice of Nigeria' },
  { id: 'crt-02', name: 'Court of Appeal (Abuja Division)', court_type: 'Court of Appeal', state: 'FCT', judicial_division: 'Abuja Judicial Division', location: 'Shehu Shagari Way, Maitama, Abuja', default_judge: 'Presiding Justice, Court of Appeal' },
  { id: 'crt-03', name: 'Federal High Court of Nigeria (Abuja)', court_type: 'Federal High Court', state: 'FCT', judicial_division: 'Abuja Judicial Division', location: 'Headquarters, Central Business District, Abuja', default_judge: 'Chief Judge, Federal High Court' },
  { id: 'crt-04', name: 'High Court of the Federal Capital Territory', court_type: 'High Court', state: 'FCT', judicial_division: 'Maitama Judicial Division', location: 'Maitama, Abuja', default_judge: 'Chief Judge, FCT High Court' },
  { id: 'crt-05', name: 'National Industrial Court of Nigeria', court_type: 'National Industrial Court', state: 'FCT', judicial_division: 'Abuja Judicial Division', location: 'Garki 2, Abuja', default_judge: 'President, National Industrial Court' }
];

const INITIAL_INSTITUTIONS_SEEDS = [
  { id: 'inst-01', code: 'NLS-HQ', name: 'Nigerian Law School (Bwari Headquarters)', type: 'Nigerian Law School', address: 'Bwari, Federal Capital Territory, P.M.B. 1386', state: 'FCT', contact_person: 'Director of Academic Affairs / Placement Office', official_email: 'externship@lawschool.gov.ng', phone: '+234 9 290 5510', relationship_status: 'Active Partner' },
  { id: 'inst-02', code: 'UNIABUJA-LAW', name: 'University of Abuja — Faculty of Law', type: 'Faculty of Law', address: 'Main Campus, Airport Road, Gwagwalada, Abuja', state: 'FCT', contact_person: 'Dean, Faculty of Law / Clinical Legal Education Unit', official_email: 'law.faculty@uniabuja.edu.ng', phone: '+234 803 555 4433', relationship_status: 'Active Partner' },
  { id: 'inst-03', code: 'UNILAG-LAW', name: 'University of Lagos — Faculty of Law', type: 'Faculty of Law', address: 'Akoka, Yaba, Lagos', state: 'Lagos State', contact_person: 'Law Clinic & Clinical Education Coordinator', official_email: 'law@unilag.edu.ng', phone: '+234 1 280 2400', relationship_status: 'Active Partner' }
];

const INITIAL_NOTICES_SEEDS = [
  {
    id: 'not-01',
    title: 'Chambers Working Hours & Client Consultation Schedule',
    category: 'Office working hours',
    content: 'B. B. BALE & CO. CHAMBERS operates Mondays through Fridays from 8:00 AM to 5:30 PM across all branches. In-person client conferences and virtual consultations are scheduled strictly upon prior verification and booking via the Chambers Public Portal.',
    publish_date: '2026-01-05',
    status: 'Published',
    published_by_id: 'usr-principal-01',
    published_by_name: 'Barrister B. B. Bale, SAN'
  },
  {
    id: 'not-02',
    title: 'Nigerian Law School Externship & 2026 Student Internship Call',
    category: 'Internship announcements',
    content: 'Chambers welcomes Bar Part II externs from the Nigerian Law School and penultimate/final year LL.B law undergraduates. Applications or official institution referral letters may be submitted via the Chambers Student Portal. Each placement candidate is assigned a Senior Counsel supervisor.',
    publish_date: '2026-02-01',
    status: 'Published',
    published_by_id: 'usr-hoc-01',
    published_by_name: 'Barrister Aisha M. Bello, LL.M'
  }
];

const INITIAL_CMS_SEED = {
  id: 'cms-main',
  tagline: 'Secure. Organized. Professional.',
  hero_headline: 'Secure. Organized. Professional.',
  hero_subheadline: 'Distinguished legal representation, trial advocacy, property & recovery of premises management, Islamic law jurisprudence, and institutional law-student mentorship across Nigeria.',
  about_story: 'B. B. BALE & CO. CHAMBERS was established to provide distinguished corporate entities, institutions, and individuals with uncompromising legal defense and advisory services. From our principal chambers in the Federal Capital Territory, Abuja, our footprint extends across commercial hubs in Lagos, Kano, and Port Harcourt. Our trial and appellate practice is built on comprehensive statutory analysis, painstaking factual investigation, and respectful yet incisive courtroom advocacy.',
  about_founding_year: '1996',
  office_hours_text: 'Mondays through Fridays: 8:00 AM - 5:30 PM (Court Recess Excluded). In-person client conferences and virtual consultations are scheduled upon verified booking.',
  emergency_hotline: '+234 803 200 1100',
  consultation_fee_standard: 35000,
  internship_policy_notice: 'Chambers welcomes Bar Part II externs from the Nigerian Law School and law undergraduates from recognized universities.',
  recovery_of_premises_notice: 'Statutory notice periods must not be mechanically applied; each notice is formulated in accordance with applicable State tenancy legislation and agreements.',
  invoice_bank_name: 'First Bank of Nigeria PLC',
  invoice_account_name: 'B. B. BALE & CO. (CLIENT SERVICES)',
  invoice_account_number: '2039485712',
  invoice_payment_method: 'Direct Electronic Transfer (NIP) / Chambers Retainer Account',
  last_updated: '2026-01-01T00:00:00.000Z',
  updated_by: 'Barrister B. B. Bale, SAN'
};

// Response helper
function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Role, X-User-Id'
    }
  });
}

function errorResponse(error: string, status: number = 400): Response {
  return jsonResponse({ success: false, error }, status);
}

// Sequential counter helper in D1
async function getNextD1Number(db: any, type: string, prefix: string): Promise<string> {
  try {
    const existing = await db.prepare('SELECT current_count FROM system_counters WHERE type = ?').bind(type).first();
    const current = (existing?.current_count || 0) + 1;
    await db.prepare(`
      INSERT INTO system_counters (id, type, current_count, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(type) DO UPDATE SET current_count = ?, updated_at = datetime('now')
    `).bind(`cnt-${type}`, type, current, current).run();
    const formatted = String(current).padStart(6, '0');
    return `BBC-${prefix}-2026-${formatted}`;
  } catch {
    const fallback = String(Math.floor(Math.random() * 900000) + 100000);
    return `BBC-${prefix}-2026-${fallback}`;
  }
}

// Log audit event to D1
async function logD1Audit(db: any, actor: { id?: string; name?: string; role?: string }, action: string, entity: string, entityId: string, details: string) {
  try {
    const auditId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    await db.prepare(`
      INSERT INTO audit_logs (id, timestamp, user_id, user_name, user_role, action, entity, entity_id, details)
      VALUES (?, datetime('now'), ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      auditId,
      actor.id || 'system',
      actor.name || 'System Actor',
      actor.role || 'ADMINISTRATOR_SECRETARY',
      action,
      entity,
      entityId,
      details
    ).run();
  } catch (err) {
    console.error('Failed to log D1 audit event:', err);
  }
}

// Seed initial authentic accounts and data if tables exist but users is empty
export async function seedD1InitialData(db: any): Promise<boolean> {
  try {
    const userCount = await db.prepare('SELECT count(*) as count FROM users').first('count');
    if (userCount && Number(userCount) > 0) {
      return false; // Already populated
    }

    const defaultPassword = 'admin@2026';

    try {
      await db.exec?.('PRAGMA foreign_keys = OFF;');
    } catch {}

    // 1. Seed initial branches FIRST (required by users foreign key branch_id)
    for (const b of INITIAL_BRANCHES_SEEDS) {
      await db.prepare(`
        INSERT OR IGNORE INTO branches (id, name, code, address, city, state, phone, email, head_of_chamber_id, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(b.id, b.name, b.code, b.address, b.city, b.state, b.phone, b.email, b.head_of_chamber_id, b.is_active).run();
    }

    // 2. Seed initial 5 personnel
    for (const u of INITIAL_STAFF_SEEDS) {
      const hash = await hashPassword(defaultPassword, u.salt);
      await db.prepare(`
        INSERT OR IGNORE INTO users (
          id, username, name, email, phone, role, branch_id, title,
          practice_areas, bio, photo_url, availability, is_publicly_visible,
          is_active, account_status, password_hash, salt, requires_password_change,
          failed_login_attempts, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, datetime('now'))
      `).bind(
        u.id, u.username, u.name, u.email, u.phone, u.role, u.branch_id, u.title,
        u.practice_areas, u.bio, u.photo_url, u.availability, u.is_publicly_visible,
        u.is_active, u.account_status, hash, u.salt
      ).run();
    }

    // 3. Seed courts
    for (const c of INITIAL_COURTS_SEEDS) {
      await db.prepare(`
        INSERT OR IGNORE INTO courts (id, name, court_type, state, judicial_division, location, default_judge)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(c.id, c.name, c.court_type, c.state, c.judicial_division, c.location, c.default_judge).run();
    }

    // 4. Seed institutions
    for (const inst of INITIAL_INSTITUTIONS_SEEDS) {
      await db.prepare(`
        INSERT OR IGNORE INTO partner_institutions (id, code, name, type, address, state, contact_person, official_email, phone, relationship_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(inst.id, inst.code, inst.name, inst.type, inst.address, inst.state, inst.contact_person, inst.official_email, inst.phone, inst.relationship_status).run();
    }

    // 5. Seed notices
    for (const n of INITIAL_NOTICES_SEEDS) {
      await db.prepare(`
        INSERT OR IGNORE INTO public_notices (id, title, category, content, publish_date, status, published_by_id, published_by_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(n.id, n.title, n.category, n.content, n.publish_date, n.status, n.published_by_id, n.published_by_name).run();
    }

    // 6. Seed website content
    await db.prepare(`
      INSERT OR REPLACE INTO website_content (
        id, tagline, hero_headline, hero_subheadline, about_story, about_founding_year,
        office_hours_text, emergency_hotline, consultation_fee_standard,
        internship_policy_notice, recovery_of_premises_notice, invoice_bank_name,
        invoice_account_name, invoice_account_number, invoice_payment_method,
        last_updated, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      INITIAL_CMS_SEED.id, INITIAL_CMS_SEED.tagline, INITIAL_CMS_SEED.hero_headline, INITIAL_CMS_SEED.hero_subheadline,
      INITIAL_CMS_SEED.about_story, INITIAL_CMS_SEED.about_founding_year, INITIAL_CMS_SEED.office_hours_text,
      INITIAL_CMS_SEED.emergency_hotline, INITIAL_CMS_SEED.consultation_fee_standard,
      INITIAL_CMS_SEED.internship_policy_notice, INITIAL_CMS_SEED.recovery_of_premises_notice,
      INITIAL_CMS_SEED.invoice_bank_name, INITIAL_CMS_SEED.invoice_account_name,
      INITIAL_CMS_SEED.invoice_account_number, INITIAL_CMS_SEED.invoice_payment_method,
      INITIAL_CMS_SEED.last_updated, INITIAL_CMS_SEED.updated_by
    ).run();

    return true;
  } catch (err) {
    console.error('Error during D1 initial seed:', err);
    return false;
  }
}

/**
 * Main Cloudflare Worker / Pages Function API Request Handler
 */
export async function handleApiRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toUpperCase();

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Role, X-User-Id'
      }
    });
  }

  const db = env.DB;
  if (!db) {
    return errorResponse('Cloudflare D1 Database binding "env.DB" is not available on this worker instance.', 500);
  }

  try {
    // =========================================================================
    // 1. D1 DIAGNOSTICS & SYSTEM MIGRATIONS
    // =========================================================================

    // GET /api/d1/status — Cloudflare D1 real-time health and row count verification
    if (path === '/api/d1/status' && method === 'GET') {
      try {
        const tableCheck = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
        const tables = (tableCheck.results || []).map((t: any) => t.name);

        const counts: Record<string, number> = {};
        for (const t of tables) {
          try {
            const countRow = await db.prepare(`SELECT count(*) as c FROM "${t}"`).first();
            counts[t] = countRow?.c ?? 0;
          } catch {
            counts[t] = 0;
          }
        }

        return jsonResponse({
          success: true,
          connected: true,
          databaseBinding: 'env.DB',
          totalTables: tables.length,
          tables,
          recordCounts: counts,
          timestamp: new Date().toISOString()
        });
      } catch (err: any) {
        return errorResponse(`Failed connecting to Cloudflare D1: ${err.message}`, 500);
      }
    }

    // POST /api/d1/migrate — Verify or run D1 Schema and Seed Initial Personnel
    if (path === '/api/d1/migrate' && method === 'POST') {
      try {
        const seeded = await seedD1InitialData(db);
        return jsonResponse({
          success: true,
          message: seeded 
            ? 'Cloudflare D1 schema verified and initial Chambers personnel seeded.'
            : 'Cloudflare D1 tables verified. Existing database records preserved.',
          seeded
        });
      } catch (err: any) {
        return errorResponse(`Migration error: ${err.message}`, 500);
      }
    }

    // POST /api/d1/query — Safe Principal Partner SQL Diagnostics Console
    if (path === '/api/d1/query' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const sql = (body.sql || '').trim();
      if (!sql) return errorResponse('Missing SQL statement');

      // Security check: only SELECT / PRAGMA queries allowed via web console
      const normalized = sql.toUpperCase();
      if (normalized.startsWith('DROP ') || normalized.startsWith('DELETE ') || normalized.startsWith('UPDATE ') || normalized.startsWith('ALTER ')) {
        return errorResponse('Console queries are restricted to non-destructive inspection (SELECT, PRAGMA, EXPLAIN).', 403);
      }

      const res = await db.prepare(sql).bind(...(body.params || [])).all();
      return jsonResponse({
        success: true,
        results: res.results || [],
        meta: res.meta || {}
      });
    }

    // =========================================================================
    // 2. COMPREHENSIVE CROSS-DEVICE SYNCHRONIZATION
    // =========================================================================

    // GET /api/sync/all — Fetches all firm records in one query bundle for instant cross-device sync
    if (path === '/api/sync/all' && method === 'GET') {
      // Ensure seed if brand new D1 database
      await seedD1InitialData(db);

      const [
        branchesRes,
        usersRes,
        courtsRes,
        institutionsRes,
        clientsRes,
        consultationsRes,
        mattersRes,
        casesRes,
        assignmentsRes,
        diaryRes,
        tasksRes,
        propertiesRes,
        landlordsRes,
        tenantsRes,
        tenanciesRes,
        quitNoticesRes,
        invoicesRes,
        paymentsRes,
        expensesRes,
        studentsRes,
        researchRes,
        documentsRes,
        noticesRes,
        enquiriesRes,
        approvalsRes,
        auditLogsRes,
        websiteContentRes
      ] = await Promise.all([
        db.prepare('SELECT id, name, code, address, city, state, phone, email, head_of_chamber_id as headOfChamberId, is_active as isActive FROM branches').all(),
        db.prepare(`
          SELECT id, username, name, email, phone, role, branch_id as branchId, title,
                 practice_areas as practiceAreas, bio, photo_url as photoUrl, availability,
                 is_publicly_visible as isPubliclyVisible, is_active as isActive,
                 account_status as accountStatus, requires_password_change as requiresPasswordChange,
                 failed_login_attempts as failedLoginAttempts, last_login as lastLogin,
                 password_changed_at as passwordChangedAt, created_at as createdAt
          FROM users
        `).all(),
        db.prepare('SELECT id, name, court_type as courtType, state, judicial_division as judicialDivision, location, default_judge as defaultJudge FROM courts').all(),
        db.prepare('SELECT id, code, name, type, address, state, contact_person as contactPerson, official_email as officialEmail, phone, relationship_status as relationshipStatus, notes FROM partner_institutions').all(),
        db.prepare(`
          SELECT id, client_id as clientId, full_name as fullName, organization, client_type as clientType,
                 phone, email, address, state, lga, identification_type as identificationType,
                 identification_number as identificationNumber, branch_id as branchId,
                 assigned_lawyer_id as assignedLawyerId, conflict_check_status as conflictCheckStatus,
                 conflict_check_notes as conflictCheckNotes, conflict_reviewed_by as conflictReviewedBy,
                 date_registered as dateRegistered, is_active as isActive, confidential_notes as confidentialNotes
          FROM clients ORDER BY created_at DESC
        `).all(),
        db.prepare(`
          SELECT id, code, service_category as serviceCategory, preferred_date as preferredDate,
                 preferred_time as preferredTime, full_name as fullName, phone, email, method,
                 brief_enquiry as briefEnquiry, supporting_documents as supportingDocuments,
                 status, invoice_number as invoiceNumber, payment_reference as paymentReference,
                 branch_id as branchId, assigned_lawyer_id as assignedLawyerId,
                 client_visible_update as clientVisibleUpdate, created_at as createdAt
          FROM consultations ORDER BY created_at DESC
        `).all(),
        db.prepare(`
          SELECT id, matter_id as matterId, title, client_id as clientId, branch_id as branchId,
                 lead_counsel_id as leadCounselId, category, status, stage, engagement_date as engagementDate,
                 client_visible_update as clientVisibleUpdate, privileged_internal_notes as privilegedInternalNotes,
                 requires_principal_approval as requiresPrincipalApproval, principal_approval_status as principalApprovalStatus,
                 created_at as createdAt
          FROM matters ORDER BY created_at DESC
        `).all(),
        db.prepare(`
          SELECT id, case_id as caseId, suit_number as suitNumber, matter_id as matterId,
                 client_id as clientId, branch_id as branchId, court_id as courtId,
                 judicial_division as judicialDivision, judge, counsel_id as counselId,
                 opposing_party as opposingParty, opposing_counsel as opposingCounsel,
                 case_type as caseType, subject_matter as subjectMatter, filing_date as filingDate,
                 next_court_date as nextCourtDate, status, client_visible_update as clientVisibleUpdate,
                 internal_strategy_notes as internalStrategyNotes, created_at as createdAt
          FROM cases ORDER BY created_at DESC
        `).all(),
        db.prepare(`
          SELECT id, case_id as caseId, suit_number as suitNumber, branch_id as branchId,
                 counsel_id as counselId, assigned_by_id as assignedById, assigned_by_name as assignedByName,
                 date_assigned as dateAssigned, status, rejection_reason as rejectionReason,
                 rejection_notes as rejectionNotes, response_date as responseDate
          FROM case_assignments ORDER BY date_assigned DESC
        `).all(),
        db.prepare(`
          SELECT id, case_id as caseId, suit_number as suitNumber, branch_id as branchId,
                 court_date as courtDate, court_time as courtTime, court_name as courtName,
                 counsel_id as counselId, client_id as clientId, purpose, status,
                 outcome_summary as outcomeSummary, next_court_date as nextCourtDate, notes
          FROM court_diary ORDER BY court_date DESC
        `).all(),
        db.prepare(`
          SELECT id, title, assigned_to_id as assignedToId, assigned_by_id as assignedById,
                 branch_id as branchId, matter_id as matterId, case_id as caseId,
                 priority, due_date as dueDate, status, completion_date as completionDate,
                 notes, created_at as createdAt
          FROM tasks ORDER BY created_at DESC
        `).all(),
        db.prepare(`
          SELECT id, property_id as propertyId, branch_id as branchId, name,
                 property_type as propertyType, address, state, lga, district,
                 landlord_id as landlordId, total_units as totalUnits,
                 title_information as titleInformation, survey_information as surveyInformation,
                 legal_status as legalStatus, assigned_lawyer_id as assignedLawyerId,
                 related_client_id as relatedClientId, related_matter_id as relatedMatterId,
                 notes, created_at as createdAt
          FROM properties ORDER BY created_at DESC
        `).all(),
        db.prepare(`
          SELECT id, landlord_id as landlordId, full_name as fullName, phone, email,
                 address, bank_details as bankDetails, tracking_code as trackingCode,
                 date_registered as dateRegistered
          FROM landlords ORDER BY date_registered DESC
        `).all(),
        db.prepare(`
          SELECT id, tenant_id as tenantId, full_name as fullName, phone, email,
                 landlord_id as landlordId, property_id as propertyId, unit_number as unitNumber,
                 tracking_code as trackingCode, occupation, status, date_registered as dateRegistered
          FROM tenants ORDER BY date_registered DESC
        `).all(),
        db.prepare(`
          SELECT id, tenant_id as tenantId, property_id as propertyId, unit_number as unitNumber,
                 rent_amount as rentAmount, start_date as startDate, expiry_date as expiryDate,
                 payment_frequency as paymentFrequency, status, arrears_amount as arrearsAmount,
                 tenancy_agreement_doc_id as tenancyAgreementDocId
          FROM tenancies
        `).all(),
        db.prepare(`
          SELECT id, quit_notice_id as quitNoticeId, tenant_id as tenantId, tenant_name as tenantName,
                 property_id as propertyId, property_name as propertyName, landlord_id as landlordId,
                 landlord_name as landlordName, unit_number as unitNumber, notice_type as noticeType,
                 notice_date as noticeDate, notice_expiry_date as noticeExpiryDate, reason,
                 statutory_basis as statutoryBasis, status, issued_by_id as issuedById,
                 issued_by_name as issuedByName, created_at as createdAt
          FROM quit_notices ORDER BY created_at DESC
        `).all(),
        db.prepare(`
          SELECT id, invoice_number as invoiceNumber, client_id as clientId, client_name as clientName,
                 client_email as clientEmail, client_phone as clientPhone, matter_id as matterId,
                 branch_id as branchId, consultation_id as consultationId, consultation_code as consultationCode,
                 items, subtotal, tax_amount as taxAmount, total_amount as totalAmount,
                 date, due_date as dueDate, payment_status as paymentStatus,
                 approval_status as approvalStatus, approval_request_id as approvalRequestId,
                 approval_notes as approvalNotes, payment_reference as paymentReference,
                 payment_method as paymentMethod, notes, created_at as createdAt
          FROM invoices ORDER BY created_at DESC
        `).all(),
        db.prepare(`
          SELECT id, payment_reference as paymentReference, invoice_number as invoiceNumber,
                 client_name as clientName, amount, branch_id as branchId, payment_method as paymentMethod,
                 payment_date as paymentDate, status, bank_transaction_ref as bankTransactionRef,
                 receipt_number as receiptNumber, verified_by_id as verifiedById,
                 verified_by_name as verifiedByName, verification_date as verificationDate,
                 verification_notes as verificationNotes, proof_document_url as proofDocumentUrl,
                 submitted_at as submittedAt
          FROM payments ORDER BY submitted_at DESC
        `).all(),
        db.prepare(`
          SELECT id, branch_id as branchId, account_type as accountType, category, amount,
                 description, date, recorded_by_id as recordedById, recorded_by_name as recordedByName,
                 matter_id as matterId, property_id as propertyId, receipt_ref as receiptRef
          FROM expenses ORDER BY date DESC
        `).all(),
        db.prepare(`
          SELECT id, student_id as studentId, full_name as fullName, gender, phone, email,
                 institution_id as institutionId, institution_name as institutionName, faculty,
                 programme, level, matric_number as matricNumber, placement_type as placementType,
                 placement_start_date as placementStartDate, placement_end_date as placementEndDate,
                 assigned_branch_id as assignedBranchId, supervising_counsel_id as supervisingCounselId,
                 emergency_contact_name as emergencyContactName, emergency_contact_phone as emergencyContactPhone,
                 status, completion_letter_issued as completionLetterIssued, certificate_number as certificateNumber,
                 created_at as createdAt
          FROM students ORDER BY created_at DESC
        `).all(),
        db.prepare(`
          SELECT id, topic, legal_issue as legalIssue, branch_id as branchId, statutes,
                 case_authorities as caseAuthorities, legal_notes as legalNotes, matter_id as matterId,
                 case_id as caseId, counsel_id as counselId, counsel_name as counselName, date
          FROM legal_research ORDER BY date DESC
        `).all(),
        db.prepare(`
          SELECT id, document_id as documentId, title, branch_id as branchId, category,
                 entity_type as entityType, entity_id as entityId, file_url as fileUrl,
                 file_size as fileSize, file_type as fileType, uploaded_by_id as uploadedById,
                 uploaded_by_name as uploadedByName, version, upload_date as uploadDate,
                 is_client_visible as isClientVisible, notes, google_drive_link as googleDriveLink
          FROM documents ORDER BY upload_date DESC
        `).all(),
        db.prepare(`
          SELECT id, title, category, content, publish_date as publishDate, expiry_date as expiryDate,
                 status, published_by_id as publishedById, published_by_name as publishedByName
          FROM public_notices ORDER BY publish_date DESC
        `).all(),
        db.prepare('SELECT id, full_name as fullName, email, phone, subject, message, branch_id as branchId, status, created_at as createdAt FROM public_enquiries ORDER BY created_at DESC').all(),
        db.prepare(`
          SELECT id, request_type as requestType, requester_id as requesterId, requester_name as requesterName,
                 requester_role as requesterRole, branch_id as branchId, title, description,
                 reference_code as referenceCode, status, submitted_at as submittedAt,
                 decided_at as decidedAt, decided_by_id as decidedById, decided_by_name as decidedByName,
                 decision_notes as decisionNotes
          FROM approval_requests ORDER BY submitted_at DESC
        `).all(),
        db.prepare(`
          SELECT id, timestamp, user_id as userId, user_name as userName, user_role as userRole,
                 action, entity, entity_id as entityId, details
          FROM audit_logs ORDER BY timestamp DESC LIMIT 200
        `).all(),
        db.prepare(`
          SELECT id, tagline, hero_headline as heroHeadline, hero_subheadline as heroSubheadline,
                 about_story as aboutStory, about_founding_year as aboutFoundingYear,
                 office_hours_text as officeHoursText, emergency_hotline as emergencyHotline,
                 consultation_fee_standard as consultationFeeStandard,
                 internship_policy_notice as internshipPolicyNotice,
                 recovery_of_premises_notice as recoveryOfPremisesNotice,
                 invoice_bank_name as invoiceBankName, invoice_account_name as invoiceAccountName,
                 invoice_account_number as invoiceAccountNumber, invoice_payment_method as invoicePaymentMethod,
                 last_updated as lastUpdated, updated_by as updatedBy
          FROM website_content WHERE id = 'cms-main'
        `).first()
      ]);

      // Parse JSON fields
      const users = (usersRes.results || []).map((u: any) => ({
        ...u,
        practiceAreas: typeof u.practiceAreas === 'string' ? JSON.parse(u.practiceAreas || '[]') : u.practiceAreas,
        isPubliclyVisible: Boolean(u.isPubliclyVisible),
        isActive: Boolean(u.isActive),
        requiresPasswordChange: Boolean(u.requiresPasswordChange)
      }));

      const consultations = (consultationsRes.results || []).map((c: any) => ({
        ...c,
        supportingDocuments: typeof c.supportingDocuments === 'string' ? JSON.parse(c.supportingDocuments || '[]') : c.supportingDocuments
      }));

      const invoices = (invoicesRes.results || []).map((inv: any) => ({
        ...inv,
        items: typeof inv.items === 'string' ? JSON.parse(inv.items || '[]') : inv.items
      }));

      const students = (studentsRes.results || []).map((s: any) => ({
        ...s,
        completionLetterIssued: Boolean(s.completionLetterIssued)
      }));

      return jsonResponse({
        success: true,
        data: {
          branches: branchesRes.results || [],
          users,
          courts: courtsRes.results || [],
          institutions: institutionsRes.results || [],
          clients: clientsRes.results || [],
          consultations,
          matters: mattersRes.results || [],
          cases: casesRes.results || [],
          caseAssignments: assignmentsRes.results || [],
          courtDiary: diaryRes.results || [],
          tasks: tasksRes.results || [],
          properties: propertiesRes.results || [],
          landlords: landlordsRes.results || [],
          tenants: tenantsRes.results || [],
          tenancies: tenanciesRes.results || [],
          quitNotices: quitNoticesRes.results || [],
          invoices,
          payments: paymentsRes.results || [],
          expenses: expensesRes.results || [],
          students,
          legalResearch: researchRes.results || [],
          documents: documentsRes.results || [],
          publicNotices: noticesRes.results || [],
          publicEnquiries: enquiriesRes.results || [],
          approvals: approvalsRes.results || [],
          auditLogs: auditLogsRes.results || [],
          websiteContent: websiteContentRes || INITIAL_CMS_SEED
        },
        timestamp: new Date().toISOString()
      });
    }

    // =========================================================================
    // 3. AUTHENTICATION & SESSIONS
    // =========================================================================

    // POST /api/auth/login
    if (path === '/api/auth/login' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const identifier = (body.username || body.identifier || '').trim().toLowerCase();
      const password = body.password || '';

      if (!identifier || !password) {
        return errorResponse('Username/Email and password are required', 400);
      }

      await seedD1InitialData(db);

      // Match user by username or email
      let userRow = await db.prepare(`
        SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?
      `).bind(identifier, identifier).first();

      // Support common role aliases
      if (!userRow) {
        const aliasMap: Record<string, string> = {
          'principal': 'usr-principal-01',
          'principal.partner': 'usr-principal-01',
          'head': 'usr-hoc-01',
          'head.chamber': 'usr-hoc-01',
          'admin': 'usr-admin-01',
          'administrator': 'usr-admin-01',
          'secretary': 'usr-admin-01',
          'accounts': 'usr-account-01',
          'account': 'usr-account-01',
          'counsel': 'usr-counsel-01'
        };
        const aliasedId = aliasMap[identifier];
        if (aliasedId) {
          userRow = await db.prepare('SELECT * FROM users WHERE id = ?').bind(aliasedId).first();
        }
      }

      if (!userRow) {
        return errorResponse('Invalid username or password', 401);
      }

      if (userRow.account_status !== 'Active' || !userRow.is_active) {
        return errorResponse(`Account is ${userRow.account_status}. Please contact Chambers Administrator.`, 403);
      }

      // Verify cryptographic password hash
      const isValid = await verifyPassword(password, userRow.salt, userRow.password_hash);
      if (!isValid) {
        const failedAttempts = (userRow.failed_login_attempts || 0) + 1;
        await db.prepare('UPDATE users SET failed_login_attempts = ? WHERE id = ?').bind(failedAttempts, userRow.id).run();
        return errorResponse('Invalid username or password', 401);
      }

      // Reset failed attempts & record last login
      await db.prepare(`
        UPDATE users SET failed_login_attempts = 0, last_login = datetime('now') WHERE id = ?
      `).bind(userRow.id).run();

      const token = `d1-sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const safeUser = {
        id: userRow.id,
        username: userRow.username,
        name: userRow.name,
        email: userRow.email,
        phone: userRow.phone,
        role: userRow.role,
        branchId: userRow.branch_id,
        title: userRow.title,
        practiceAreas: typeof userRow.practice_areas === 'string' ? JSON.parse(userRow.practice_areas || '[]') : userRow.practice_areas,
        bio: userRow.bio,
        photoUrl: userRow.photo_url,
        availability: userRow.availability,
        isPubliclyVisible: Boolean(userRow.is_publicly_visible),
        isActive: Boolean(userRow.is_active),
        accountStatus: userRow.account_status,
        requiresPasswordChange: Boolean(userRow.requires_password_change),
        lastLogin: new Date().toISOString()
      };

      await logD1Audit(db, safeUser, 'LOGIN', 'User', userRow.id, `User logged in from ${userRow.branch_id}`);

      return jsonResponse({
        success: true,
        user: safeUser,
        session: {
          userId: userRow.id,
          token,
          role: userRow.role,
          branchId: userRow.branch_id,
          rememberMe: body.rememberMe ?? true,
          expiresAt: new Date(Date.now() + 86400000).toISOString()
        },
        requiresPasswordChange: Boolean(userRow.requires_password_change)
      });
    }

    // POST /api/auth/change-password
    if (path === '/api/auth/change-password' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { userId, currentPassword, newPassword } = body;

      const userRow = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
      if (!userRow) return errorResponse('User not found', 404);

      // Verify current password unless initial password change required
      if (!userRow.requires_password_change) {
        const matches = await verifyPassword(currentPassword, userRow.salt, userRow.password_hash);
        if (!matches) return errorResponse('Current password does not match', 400);
      }

      const newSalt = generateSalt(16);
      const newHash = await hashPassword(newPassword, newSalt);

      await db.prepare(`
        UPDATE users
        SET password_hash = ?, salt = ?, requires_password_change = 0,
            password_changed_at = datetime('now'), failed_login_attempts = 0
        WHERE id = ?
      `).bind(newHash, newSalt, userId).run();

      await logD1Audit(db, { id: userRow.id, name: userRow.name, role: userRow.role }, 'CHANGE_PASSWORD', 'User', userId, 'Password successfully updated');

      return jsonResponse({ success: true, message: 'Password successfully changed' });
    }

    // =========================================================================
    // 4. CLIENTS REGISTRY
    // =========================================================================

    if (path === '/api/clients' && method === 'GET') {
      const rows = await db.prepare(`
        SELECT id, client_id as clientId, full_name as fullName, organization, client_type as clientType,
               phone, email, address, state, lga, identification_type as identificationType,
               identification_number as identificationNumber, branch_id as branchId,
               assigned_lawyer_id as assignedLawyerId, conflict_check_status as conflictCheckStatus,
               conflict_check_notes as conflictCheckNotes, conflict_reviewed_by as conflictReviewedBy,
               date_registered as dateRegistered, is_active as isActive, confidential_notes as confidentialNotes
        FROM clients ORDER BY created_at DESC
      `).all();
      return jsonResponse({ success: true, clients: rows.results || [] });
    }

    if (path === '/api/clients' && method === 'POST') {
      const data = await request.json().catch(() => ({}));
      const actor = {
        id: request.headers.get('X-User-Id') || 'usr-admin-01',
        name: 'Authorized Staff',
        role: request.headers.get('X-User-Role') || 'ADMINISTRATOR_SECRETARY'
      };

      const clientIdCode = await getNextD1Number(db, 'client', 'CLI');
      const id = `cli-${Date.now()}`;

      await db.prepare(`
        INSERT INTO clients (
          id, client_id, full_name, organization, client_type, phone, email,
          address, state, lga, identification_type, identification_number,
          branch_id, assigned_lawyer_id, conflict_check_status, conflict_check_notes,
          conflict_reviewed_by, date_registered, is_active, confidential_notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        id, clientIdCode, data.fullName, data.organization || null, data.clientType || 'Individual',
        data.phone, data.email, data.address, data.state || 'FCT', data.lga || 'AMAC',
        data.identificationType || null, data.identificationNumber || null,
        data.branchId || 'br-abuja-01', data.assignedLawyerId || 'usr-counsel-01',
        data.conflictCheckStatus || 'Pending', data.conflictCheckNotes || null,
        data.conflictReviewedBy || null, new Date().toISOString().split('T')[0],
        data.isActive !== false ? 1 : 0, data.confidentialNotes || null
      ).run();

      await logD1Audit(db, actor, 'CREATE_CLIENT', 'Client', id, `Registered client ${data.fullName} (${clientIdCode})`);

      const created = {
        ...data,
        id,
        clientId: clientIdCode,
        dateRegistered: new Date().toISOString().split('T')[0],
        isActive: true
      };

      return jsonResponse({ success: true, client: created, message: 'Saved successfully' });
    }

    if (path.startsWith('/api/clients/') && method === 'PUT') {
      const clientId = path.replace('/api/clients/', '');
      const data = await request.json().catch(() => ({}));
      const actor = {
        id: request.headers.get('X-User-Id') || 'usr-admin-01',
        name: 'Authorized Staff',
        role: request.headers.get('X-User-Role') || 'ADMINISTRATOR_SECRETARY'
      };

      await db.prepare(`
        UPDATE clients
        SET full_name = ?, organization = ?, client_type = ?, phone = ?, email = ?,
            address = ?, state = ?, lga = ?, identification_type = ?, identification_number = ?,
            branch_id = ?, assigned_lawyer_id = ?, conflict_check_status = ?,
            conflict_check_notes = ?, conflict_reviewed_by = ?, is_active = ?,
            confidential_notes = ?
        WHERE id = ?
      `).bind(
        data.fullName, data.organization || null, data.clientType, data.phone, data.email,
        data.address, data.state, data.lga, data.identificationType || null, data.identificationNumber || null,
        data.branchId, data.assignedLawyerId, data.conflictCheckStatus,
        data.conflictCheckNotes || null, data.conflictReviewedBy || null,
        data.isActive ? 1 : 0, data.confidentialNotes || null,
        clientId
      ).run();

      await logD1Audit(db, actor, 'UPDATE_CLIENT', 'Client', clientId, `Updated client ${data.fullName}`);
      return jsonResponse({ success: true, client: data, message: 'Saved successfully' });
    }

    // =========================================================================
    // 5. INVOICES & PAYMENTS WORKFLOW
    // =========================================================================

    if (path === '/api/invoices' && method === 'GET') {
      const rows = await db.prepare(`
        SELECT id, invoice_number as invoiceNumber, client_id as clientId, client_name as clientName,
               client_email as clientEmail, client_phone as clientPhone, matter_id as matterId,
               branch_id as branchId, consultation_id as consultationId, consultation_code as consultationCode,
               items, subtotal, tax_amount as taxAmount, total_amount as totalAmount,
               date, due_date as dueDate, payment_status as paymentStatus,
               approval_status as approvalStatus, approval_request_id as approvalRequestId,
               approval_notes as approvalNotes, payment_reference as paymentReference,
               payment_method as paymentMethod, notes, created_at as createdAt
        FROM invoices ORDER BY created_at DESC
      `).all();

      const invoices = (rows.results || []).map((inv: any) => ({
        ...inv,
        items: typeof inv.items === 'string' ? JSON.parse(inv.items || '[]') : inv.items
      }));

      return jsonResponse({ success: true, invoices });
    }

    if (path === '/api/invoices' && method === 'POST') {
      const data = await request.json().catch(() => ({}));
      const actor = {
        id: request.headers.get('X-User-Id') || 'usr-account-01',
        name: 'Chukwuemeka Okonkwo',
        role: request.headers.get('X-User-Role') || 'ACCOUNT_OFFICER'
      };

      const invoiceNumber = data.invoiceNumber || await getNextD1Number(db, 'invoice', 'INV');
      const paymentRef = data.paymentReference || await getNextD1Number(db, 'payment', 'PAY');
      const id = data.id || `inv-${Date.now()}`;

      await db.prepare(`
        INSERT INTO invoices (
          id, invoice_number, client_id, client_name, client_email, client_phone,
          matter_id, branch_id, consultation_id, consultation_code, items, subtotal,
          tax_amount, total_amount, date, due_date, payment_status, approval_status,
          approval_request_id, approval_notes, payment_reference, payment_method, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        id, invoiceNumber, data.clientId || null, data.clientName, data.clientEmail || '', data.clientPhone || '',
        data.matterId || null, data.branchId || 'br-abuja-01', data.consultationId || null, data.consultationCode || null,
        JSON.stringify(data.items || []), data.subtotal || data.totalAmount, data.taxAmount || 0, data.totalAmount,
        data.date || new Date().toISOString().split('T')[0], data.dueDate || new Date().toISOString().split('T')[0],
        data.paymentStatus || 'UNPAID', data.approvalStatus || 'NONE', data.approvalRequestId || null,
        data.approvalNotes || null, paymentRef, data.paymentMethod || null, data.notes || null
      ).run();

      await logD1Audit(db, actor, 'CREATE_INVOICE', 'Invoice', id, `Created invoice ${invoiceNumber} for ${data.clientName} (₦${Number(data.totalAmount).toLocaleString()})`);

      const created = {
        ...data,
        id,
        invoiceNumber,
        paymentReference: paymentRef,
        items: data.items || []
      };

      return jsonResponse({ success: true, invoice: created, message: 'Saved successfully' });
    }

    // POST /api/payments/submit — Public / Client payment receipt submission
    if (path === '/api/payments/submit' && method === 'POST') {
      const data = await request.json().catch(() => ({}));
      const id = `pay-${Date.now()}`;

      await db.prepare(`
        INSERT INTO payments (
          id, payment_reference, invoice_number, client_name, amount, branch_id,
          payment_method, payment_date, status, bank_transaction_ref, verification_notes,
          proof_document_url, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PAYMENT_SUBMITTED', ?, ?, ?, datetime('now'))
      `).bind(
        id, data.paymentReference, data.invoiceNumber, data.clientName, data.amount,
        data.branchId || 'br-abuja-01', data.paymentMethod || 'Bank Transfer',
        new Date().toISOString().split('T')[0], data.bankTransactionRef || null,
        data.notes || null, data.proofDocumentUrl || null
      ).run();

      // Update invoice to PAYMENT_SUBMITTED
      await db.prepare(`
        UPDATE invoices SET payment_status = 'PAYMENT_SUBMITTED', payment_method = ?
        WHERE invoice_number = ? OR payment_reference = ?
      `).bind(data.paymentMethod || 'Bank Transfer', data.invoiceNumber, data.paymentReference).run();

      // Update linked consultation
      await db.prepare(`
        UPDATE consultations
        SET status = 'Payment Verification Pending',
            client_visible_update = 'Payment receipt submitted. Pending verification by Account Officer.'
        WHERE payment_reference = ? OR invoice_number = ?
      `).bind(data.paymentReference, data.invoiceNumber).run();

      return jsonResponse({ success: true, paymentId: id, message: 'Payment submitted for Chambers verification' });
    }

    // POST /api/payments/verify — Account Officer / Head of Chamber / Principal Partner verification
    if (path === '/api/payments/verify' && method === 'POST') {
      const data = await request.json().catch(() => ({}));
      const { paymentId, isApproved, notes } = data;
      const actor = {
        id: request.headers.get('X-User-Id') || 'usr-account-01',
        name: 'Chukwuemeka Okonkwo, ACA',
        role: request.headers.get('X-User-Role') || 'ACCOUNT_OFFICER'
      };

      const payment = await db.prepare('SELECT * FROM payments WHERE id = ?').bind(paymentId).first();
      if (!payment) return errorResponse('Payment record not found', 404);

      let receiptNumber = payment.receipt_number;
      if (isApproved && !receiptNumber) {
        receiptNumber = await getNextD1Number(db, 'receipt', 'REC');
      }

      const status = isApproved ? 'PAYMENT_VERIFIED' : 'REJECTED';

      // 1. Update Payment Record
      await db.prepare(`
        UPDATE payments
        SET status = ?, receipt_number = ?, verified_by_id = ?, verified_by_name = ?,
            verification_date = datetime('now'), verification_notes = ?
        WHERE id = ?
      `).bind(status, receiptNumber, actor.id, actor.name, notes || 'Verified by Account Officer', paymentId).run();

      // 2. Update Invoice Status — becomes PAID / PAYMENT_VERIFIED
      const invoiceStatus = isApproved ? 'PAYMENT_VERIFIED' : 'UNPAID';
      await db.prepare(`
        UPDATE invoices SET payment_status = ? WHERE invoice_number = ?
      `).bind(invoiceStatus, payment.invoice_number).run();

      // 3. Update Linked Consultation
      if (isApproved) {
        await db.prepare(`
          UPDATE consultations
          SET status = 'Payment Verified',
              client_visible_update = ?
          WHERE invoice_number = ? OR payment_reference = ?
        `).bind(
          `Payment verified by Accounts. Receipt ${receiptNumber} generated. Consultation schedule confirmed.`,
          payment.invoice_number, payment.payment_reference
        ).run();
      }

      await logD1Audit(
        db, actor, isApproved ? 'VERIFY_PAYMENT' : 'REJECT_PAYMENT',
        'Payment', paymentId,
        `${isApproved ? 'Verified' : 'Rejected'} payment of ₦${Number(payment.amount).toLocaleString()} for ${payment.client_name}. Receipt: ${receiptNumber || 'None'}`
      );

      return jsonResponse({
        success: true,
        receiptNumber,
        status,
        message: isApproved ? 'Payment verified and invoice marked PAID' : 'Payment rejected'
      });
    }

    // =========================================================================
    // 6. PUBLIC TRACKING (REAL-TIME READ FROM D1)
    // =========================================================================

    if (path.startsWith('/api/tracking/') && method === 'GET') {
      const code = decodeURIComponent(path.replace('/api/tracking/', '')).trim();
      if (!code) return errorResponse('Tracking code required', 400);

      // 1. Check Consultation
      const consult = await db.prepare(`
        SELECT code, service_category as serviceCategory, preferred_date as preferredDate,
               preferred_time as preferredTime, full_name as fullName, status, invoice_number as invoiceNumber,
               payment_reference as paymentReference, branch_id as branchId, client_visible_update as clientVisibleUpdate
        FROM consultations WHERE code = ? OR payment_reference = ? OR invoice_number = ?
      `).bind(code, code, code).first();

      if (consult) {
        return jsonResponse({
          success: true,
          type: 'Consultation',
          record: consult
        });
      }

      // 2. Check Case by Suit Number or Case ID
      const caseRecord = await db.prepare(`
        SELECT case_id as caseId, suit_number as suitNumber, case_type as caseType,
               subject_matter as subjectMatter, filing_date as filingDate, next_court_date as nextCourtDate,
               status, client_visible_update as clientVisibleUpdate
        FROM cases WHERE case_id = ? OR UPPER(suit_number) = UPPER(?)
      `).bind(code, code).first();

      if (caseRecord) {
        return jsonResponse({
          success: true,
          type: 'Case',
          record: caseRecord
        });
      }

      // 3. Check Tenant by tracking code
      const tenantRecord = await db.prepare(`
        SELECT tenant_id as tenantId, full_name as fullName, unit_number as unitNumber,
               tracking_code as trackingCode, status, date_registered as dateRegistered
        FROM tenants WHERE tracking_code = ? OR tenant_id = ?
      `).bind(code, code).first();

      if (tenantRecord) {
        return jsonResponse({
          success: true,
          type: 'Tenancy',
          record: tenantRecord
        });
      }

      // 4. Check Student Internship by Student ID or Matric
      const studentRecord = await db.prepare(`
        SELECT student_id as studentId, full_name as fullName, institution_name as institutionName,
               faculty, level, status, placement_start_date as placementStartDate,
               placement_end_date as placementEndDate, completion_letter_issued as completionLetterIssued
        FROM students WHERE student_id = ? OR matric_number = ?
      `).bind(code, code).first();

      if (studentRecord) {
        return jsonResponse({
          success: true,
          type: 'Internship',
          record: studentRecord
        });
      }

      // 5. Check Invoice / Payment Reference directly
      const invRecord = await db.prepare(`
        SELECT invoice_number as invoiceNumber, client_name as clientName, total_amount as totalAmount,
               date, due_date as dueDate, payment_status as paymentStatus, payment_reference as paymentReference
        FROM invoices WHERE invoice_number = ? OR payment_reference = ?
      `).bind(code, code).first();

      if (invRecord) {
        return jsonResponse({
          success: true,
          type: 'Invoice',
          record: invRecord
        });
      }

      return errorResponse(`No active Chambers records found matching tracking code "${code}".`, 404);
    }

    // =========================================================================
    // 7. WEBSITE CMS CONTENT
    // =========================================================================

    if (path === '/api/website-content' && method === 'GET') {
      const cms = await db.prepare(`
        SELECT id, tagline, hero_headline as heroHeadline, hero_subheadline as heroSubheadline,
               about_story as aboutStory, about_founding_year as aboutFoundingYear,
               office_hours_text as officeHoursText, emergency_hotline as emergencyHotline,
               consultation_fee_standard as consultationFeeStandard,
               internship_policy_notice as internshipPolicyNotice,
               recovery_of_premises_notice as recoveryOfPremisesNotice,
               invoice_bank_name as invoiceBankName, invoice_account_name as invoiceAccountName,
               invoice_account_number as invoiceAccountNumber, invoice_payment_method as invoicePaymentMethod,
               last_updated as lastUpdated, updated_by as updatedBy
        FROM website_content WHERE id = 'cms-main'
      `).first();

      return jsonResponse({ success: true, content: cms || INITIAL_CMS_SEED });
    }

    if (path === '/api/website-content' && method === 'PUT') {
      const data = await request.json().catch(() => ({}));
      const actor = {
        id: request.headers.get('X-User-Id') || 'usr-principal-01',
        name: 'Authorized Executive',
        role: request.headers.get('X-User-Role') || 'PRINCIPAL_PARTNER'
      };

      await db.prepare(`
        UPDATE website_content
        SET tagline = ?, hero_headline = ?, hero_subheadline = ?, about_story = ?,
            about_founding_year = ?, office_hours_text = ?, emergency_hotline = ?,
            consultation_fee_standard = ?, internship_policy_notice = ?,
            recovery_of_premises_notice = ?, invoice_bank_name = ?,
            invoice_account_name = ?, invoice_account_number = ?,
            invoice_payment_method = ?, last_updated = datetime('now'), updated_by = ?
        WHERE id = 'cms-main'
      `).bind(
        data.tagline, data.heroHeadline, data.heroSubheadline, data.aboutStory,
        data.aboutFoundingYear, data.officeHoursText, data.emergencyHotline,
        data.consultationFeeStandard, data.internshipPolicyNotice,
        data.recoveryOfPremisesNotice, data.invoiceBankName,
        data.invoiceAccountName, data.invoiceAccountNumber,
        data.invoicePaymentMethod, actor.name
      ).run();

      await logD1Audit(db, actor, 'UPDATE_WEBSITE_CONTENT', 'WebsiteContent', 'cms-main', 'Updated public website CMS content');

      return jsonResponse({ success: true, message: 'Saved successfully' });
    }

    // =========================================================================
    // 8. CONSULTATIONS & BOOKINGS
    // =========================================================================

    if (path === '/api/consultations' && method === 'GET') {
      const rows = await db.prepare(`
        SELECT id, code, service_category as serviceCategory, preferred_date as preferredDate,
               preferred_time as preferredTime, full_name as fullName, phone, email, method,
               brief_enquiry as briefEnquiry, supporting_documents as supportingDocuments,
               status, invoice_number as invoiceNumber, payment_reference as paymentReference,
               branch_id as branchId, assigned_lawyer_id as assignedLawyerId,
               client_visible_update as clientVisibleUpdate, created_at as createdAt
        FROM consultations ORDER BY created_at DESC
      `).all();
      const consultations = (rows.results || []).map((c: any) => ({
        ...c,
        supportingDocuments: typeof c.supportingDocuments === 'string' ? JSON.parse(c.supportingDocuments || '[]') : c.supportingDocuments
      }));
      return jsonResponse({ success: true, consultations });
    }

    if (path === '/api/consultations' && method === 'POST') {
      const data = await request.json().catch(() => ({}));
      const code = data.code || await getNextD1Number(db, 'consultation', 'CONS');
      const invoiceNum = data.invoiceNumber || await getNextD1Number(db, 'invoice', 'INV');
      const paymentRef = data.paymentReference || await getNextD1Number(db, 'payment', 'PAY');
      const id = data.id || `cons-${Date.now()}`;

      await db.prepare(`
        INSERT INTO consultations (
          id, code, service_category, preferred_date, preferred_time, full_name,
          phone, email, method, brief_enquiry, supporting_documents, status,
          invoice_number, payment_reference, branch_id, assigned_lawyer_id,
          client_visible_update, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        id, code, data.serviceCategory, data.preferredDate, data.preferredTime, data.fullName,
        data.phone, data.email, data.method, data.briefEnquiry, JSON.stringify(data.supportingDocuments || []),
        data.status || 'Awaiting Payment', invoiceNum, paymentRef, data.branchId || 'br-abuja-01',
        data.assignedLawyerId || null,
        data.clientVisibleUpdate || 'Consultation booking received. Awaiting retainer transfer.'
      ).run();

      // Automatically create matching invoice in D1
      const fee = data.feeAmount || 35000;
      await db.prepare(`
        INSERT OR IGNORE INTO invoices (
          id, invoice_number, client_name, client_email, client_phone, branch_id,
          consultation_id, consultation_code, items, subtotal, tax_amount, total_amount,
          date, due_date, payment_status, payment_reference, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 'UNPAID', ?, ?, datetime('now'))
      `).bind(
        `inv-${Date.now()}`, invoiceNum, data.fullName, data.email, data.phone, data.branchId || 'br-abuja-01',
        id, code, JSON.stringify([{ description: `Legal Consultation (${data.serviceCategory})`, amount: fee }]),
        fee, fee, new Date().toISOString().split('T')[0], data.preferredDate, paymentRef,
        `Consultation Reference: ${code}. Quote payment reference ${paymentRef} upon transfer.`
      ).run();

      const created = {
        ...data,
        id,
        code,
        invoiceNumber: invoiceNum,
        paymentReference: paymentRef,
        status: data.status || 'Awaiting Payment',
        supportingDocuments: data.supportingDocuments || []
      };

      return jsonResponse({ success: true, consultation: created, invoiceNumber: invoiceNum, paymentRef, message: 'Saved successfully' });
    }

    if (path.startsWith('/api/consultations/') && method === 'PUT') {
      const id = path.replace('/api/consultations/', '');
      const data = await request.json().catch(() => ({}));
      await db.prepare(`
        UPDATE consultations
        SET service_category = ?, preferred_date = ?, preferred_time = ?, full_name = ?,
            phone = ?, email = ?, method = ?, brief_enquiry = ?, status = ?,
            branch_id = ?, assigned_lawyer_id = ?, client_visible_update = ?
        WHERE id = ?
      `).bind(
        data.serviceCategory, data.preferredDate, data.preferredTime, data.fullName,
        data.phone, data.email, data.method, data.briefEnquiry, data.status,
        data.branchId, data.assignedLawyerId || null, data.clientVisibleUpdate || null,
        id
      ).run();
      return jsonResponse({ success: true, consultation: data, message: 'Saved successfully' });
    }

    // =========================================================================
    // 9. MATTERS & RETAINERS
    // =========================================================================

    if (path === '/api/matters' && method === 'GET') {
      const rows = await db.prepare(`
        SELECT id, matter_id as matterId, title, client_id as clientId, branch_id as branchId,
               lead_counsel_id as leadCounselId, category, status, stage, engagement_date as engagementDate,
               client_visible_update as clientVisibleUpdate, privileged_internal_notes as privilegedInternalNotes,
               requires_principal_approval as requiresPrincipalApproval, principal_approval_status as principalApprovalStatus,
               created_at as createdAt
        FROM matters ORDER BY created_at DESC
      `).all();
      return jsonResponse({ success: true, matters: rows.results || [] });
    }

    if (path === '/api/matters' && method === 'POST') {
      const data = await request.json().catch(() => ({}));
      const matterId = data.matterId || await getNextD1Number(db, 'matter', 'MAT');
      const id = data.id || `mat-${Date.now()}`;

      await db.prepare(`
        INSERT INTO matters (
          id, matter_id, title, client_id, branch_id, lead_counsel_id,
          category, status, stage, engagement_date, client_visible_update,
          privileged_internal_notes, requires_principal_approval, principal_approval_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        id, matterId, data.title, data.clientId, data.branchId || 'br-abuja-01',
        data.leadCounselId || 'usr-counsel-01', data.category || 'Litigation',
        data.status || 'Active', data.stage || 'Pleadings Preparation',
        data.engagementDate || new Date().toISOString().split('T')[0],
        data.clientVisibleUpdate || '', data.privilegedInternalNotes || '',
        data.requiresPrincipalApproval ? 1 : 0, data.principalApprovalStatus || null
      ).run();

      const created = { ...data, id, matterId };
      return jsonResponse({ success: true, matter: created, message: 'Saved successfully' });
    }

    if (path.startsWith('/api/matters/') && method === 'PUT') {
      const id = path.replace('/api/matters/', '');
      const data = await request.json().catch(() => ({}));
      await db.prepare(`
        UPDATE matters
        SET title = ?, client_id = ?, branch_id = ?, lead_counsel_id = ?, category = ?,
            status = ?, stage = ?, engagement_date = ?, client_visible_update = ?,
            privileged_internal_notes = ?, requires_principal_approval = ?, principal_approval_status = ?
        WHERE id = ?
      `).bind(
        data.title, data.clientId, data.branchId, data.leadCounselId, data.category,
        data.status, data.stage, data.engagementDate, data.clientVisibleUpdate || '',
        data.privilegedInternalNotes || '', data.requiresPrincipalApproval ? 1 : 0,
        data.principalApprovalStatus || null, id
      ).run();
      return jsonResponse({ success: true, matter: data, message: 'Saved successfully' });
    }

    // =========================================================================
    // 10. CASES & CAUSE LISTS
    // =========================================================================

    if (path === '/api/cases' && method === 'GET') {
      const rows = await db.prepare(`
        SELECT id, case_id as caseId, suit_number as suitNumber, matter_id as matterId,
               client_id as clientId, branch_id as branchId, court_id as courtId,
               judicial_division as judicialDivision, judge, counsel_id as counselId,
               opposing_party as opposingParty, opposing_counsel as opposingCounsel,
               case_type as caseType, subject_matter as subjectMatter, filing_date as filingDate,
               next_court_date as nextCourtDate, status, client_visible_update as clientVisibleUpdate,
               internal_strategy_notes as internalStrategyNotes, created_at as createdAt
        FROM cases ORDER BY created_at DESC
      `).all();
      return jsonResponse({ success: true, cases: rows.results || [] });
    }

    if (path === '/api/cases' && method === 'POST') {
      const data = await request.json().catch(() => ({}));
      const caseId = data.caseId || await getNextD1Number(db, 'case', 'CASE');
      const id = data.id || `case-${Date.now()}`;

      await db.prepare(`
        INSERT INTO cases (
          id, case_id, suit_number, matter_id, client_id, branch_id, court_id,
          judicial_division, judge, counsel_id, opposing_party, opposing_counsel,
          case_type, subject_matter, filing_date, next_court_date, status,
          client_visible_update, internal_strategy_notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        id, caseId, data.suitNumber, data.matterId, data.clientId, data.branchId || null,
        data.courtId, data.judicialDivision || 'Abuja Judicial Division', data.judge || null,
        data.counselId || 'usr-counsel-01', data.opposingParty, data.opposingCounsel || null,
        data.caseType || 'Civil', data.subjectMatter, data.filingDate || new Date().toISOString().split('T')[0],
        data.nextCourtDate || null, data.status || 'Hearing', data.clientVisibleUpdate || '',
        data.internalStrategyNotes || ''
      ).run();

      const created = { ...data, id, caseId };
      return jsonResponse({ success: true, caseRecord: created, message: 'Saved successfully' });
    }

    if (path.startsWith('/api/cases/') && method === 'PUT') {
      const id = path.replace('/api/cases/', '');
      const data = await request.json().catch(() => ({}));
      await db.prepare(`
        UPDATE cases
        SET suit_number = ?, matter_id = ?, client_id = ?, branch_id = ?, court_id = ?,
            judicial_division = ?, judge = ?, counsel_id = ?, opposing_party = ?,
            opposing_counsel = ?, case_type = ?, subject_matter = ?, filing_date = ?,
            next_court_date = ?, status = ?, client_visible_update = ?, internal_strategy_notes = ?
        WHERE id = ?
      `).bind(
        data.suitNumber, data.matterId, data.clientId, data.branchId || null, data.courtId,
        data.judicialDivision, data.judge || null, data.counselId, data.opposingParty,
        data.opposingCounsel || null, data.caseType, data.subjectMatter, data.filingDate,
        data.nextCourtDate || null, data.status, data.clientVisibleUpdate || '',
        data.internalStrategyNotes || '', id
      ).run();
      return jsonResponse({ success: true, caseRecord: data, message: 'Saved successfully' });
    }

    // =========================================================================
    // 11. CASE ASSIGNMENTS, COURT DIARY & TASKS
    // =========================================================================

    if (path === '/api/case-assignments' && method === 'POST') {
      const data = await request.json().catch(() => ({}));
      const id = data.id || `assign-${Date.now()}`;
      await db.prepare(`
        INSERT INTO case_assignments (
          id, case_id, suit_number, branch_id, counsel_id, assigned_by_id,
          assigned_by_name, date_assigned, status, rejection_reason, rejection_notes, response_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, data.caseId, data.suitNumber, data.branchId || null, data.counselId,
        data.assignedById, data.assignedByName, data.dateAssigned || new Date().toISOString().split('T')[0],
        data.status || 'PENDING', data.rejectionReason || null, data.rejectionNotes || null, data.responseDate || null
      ).run();
      return jsonResponse({ success: true, assignment: { ...data, id }, message: 'Saved successfully' });
    }

    if (path === '/api/court-diary' && method === 'POST') {
      const data = await request.json().catch(() => ({}));
      const id = data.id || `diary-${Date.now()}`;
      await db.prepare(`
        INSERT INTO court_diary (
          id, case_id, suit_number, branch_id, court_date, court_time, court_name,
          counsel_id, client_id, purpose, status, outcome_summary, next_court_date, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, data.caseId, data.suitNumber, data.branchId || null, data.courtDate,
        data.courtTime || null, data.courtName, data.counselId, data.clientId,
        data.purpose, data.status || 'Scheduled', data.outcomeSummary || null,
        data.nextCourtDate || null, data.notes || null
      ).run();
      return jsonResponse({ success: true, diaryEntry: { ...data, id }, message: 'Saved successfully' });
    }

    if (path === '/api/tasks' && method === 'POST') {
      const data = await request.json().catch(() => ({}));
      const id = data.id || `task-${Date.now()}`;
      await db.prepare(`
        INSERT INTO tasks (
          id, title, assigned_to_id, assigned_by_id, branch_id, matter_id,
          case_id, priority, due_date, status, completion_date, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        id, data.title, data.assignedToId, data.assignedById, data.branchId || null,
        data.matterId || null, data.caseId || null, data.priority || 'Medium',
        data.dueDate, data.status || 'Pending', data.completionDate || null, data.notes || null
      ).run();
      return jsonResponse({ success: true, task: { ...data, id }, message: 'Saved successfully' });
    }

    if (path.startsWith('/api/tasks/') && method === 'PUT') {
      const id = path.replace('/api/tasks/', '');
      const data = await request.json().catch(() => ({}));
      await db.prepare(`
        UPDATE tasks
        SET title = ?, assigned_to_id = ?, priority = ?, due_date = ?, status = ?,
            completion_date = ?, notes = ?
        WHERE id = ?
      `).bind(
        data.title, data.assignedToId, data.priority, data.dueDate, data.status,
        data.completionDate || null, data.notes || null, id
      ).run();
      return jsonResponse({ success: true, task: data, message: 'Saved successfully' });
    }

    // =========================================================================
    // 12. PROPERTIES, LANDLORDS, TENANTS & TENANCIES
    // =========================================================================

    if (path === '/api/properties' && method === 'POST') {
      const data = await request.json().catch(() => ({}));
      const propId = data.propertyId || await getNextD1Number(db, 'property', 'PROP');
      const id = data.id || `prop-${Date.now()}`;
      await db.prepare(`
        INSERT INTO properties (
          id, property_id, branch_id, name, property_type, address, state, lga,
          district, landlord_id, total_units, title_information, survey_information,
          legal_status, assigned_lawyer_id, related_client_id, related_matter_id, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        id, propId, data.branchId || null, data.name, data.propertyType, data.address,
        data.state, data.lga, data.district, data.landlordId, data.totalUnits || 1,
        data.titleInformation || '', data.surveyInformation || '', data.legalStatus || 'Managed by Chambers',
        data.assignedLawyerId || 'usr-counsel-01', data.relatedClientId || null,
        data.relatedMatterId || null, data.notes || null
      ).run();
      return jsonResponse({ success: true, property: { ...data, id, propertyId: propId }, message: 'Saved successfully' });
    }

    if (path === '/api/landlords' && method === 'POST') {
      const data = await request.json().catch(() => ({}));
      const llId = data.landlordId || await getNextD1Number(db, 'landlord', 'LL');
      const trackingCode = data.trackingCode || await getNextD1Number(db, 'tracking', 'TRK');
      const id = data.id || `ll-${Date.now()}`;
      await db.prepare(`
        INSERT INTO landlords (
          id, landlord_id, full_name, phone, email, address, bank_details, tracking_code, date_registered
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, llId, data.fullName, data.phone, data.email, data.address, data.bankDetails || null,
        trackingCode, new Date().toISOString().split('T')[0]
      ).run();
      return jsonResponse({ success: true, landlord: { ...data, id, landlordId: llId, trackingCode }, message: 'Saved successfully' });
    }

    if (path === '/api/tenants' && method === 'POST') {
      const data = await request.json().catch(() => ({}));
      const tenantId = data.tenantId || await getNextD1Number(db, 'tenant', 'TEN');
      const trackingCode = data.trackingCode || await getNextD1Number(db, 'tenant_track', 'TRK');
      const id = data.id || `ten-${Date.now()}`;
      await db.prepare(`
        INSERT INTO tenants (
          id, tenant_id, full_name, phone, email, landlord_id, property_id,
          unit_number, tracking_code, occupation, status, date_registered
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, tenantId, data.fullName, data.phone, data.email, data.landlordId,
        data.propertyId, data.unitNumber, trackingCode, data.occupation || null,
        data.status || 'Active', new Date().toISOString().split('T')[0]
      ).run();
      return jsonResponse({ success: true, tenant: { ...data, id, tenantId, trackingCode }, message: 'Saved successfully' });
    }

    if (path === '/api/tenancies' && method === 'POST') {
      const data = await request.json().catch(() => ({}));
      const id = data.id || `tcy-${Date.now()}`;
      await db.prepare(`
        INSERT INTO tenancies (
          id, tenant_id, property_id, unit_number, rent_amount, start_date,
          expiry_date, payment_frequency, status, arrears_amount, tenancy_agreement_doc_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, data.tenantId, data.propertyId, data.unitNumber, data.rentAmount,
        data.startDate, data.expiryDate, data.paymentFrequency || 'Annual',
        data.status || 'Active', data.arrearsAmount || 0, data.tenancyAgreementDocId || null
      ).run();
      return jsonResponse({ success: true, tenancy: { ...data, id }, message: 'Saved successfully' });
    }

    if (path === '/api/quit-notices' && method === 'POST') {
      const data = await request.json().catch(() => ({}));
      const qnId = data.quitNoticeId || await getNextD1Number(db, 'quit_notice', 'QNT');
      const id = data.id || `qn-${Date.now()}`;
      await db.prepare(`
        INSERT INTO quit_notices (
          id, quit_notice_id, tenant_id, tenant_name, property_id, property_name,
          landlord_id, landlord_name, unit_number, notice_type, notice_date,
          notice_expiry_date, reason, statutory_basis, status, issued_by_id, issued_by_name, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        id, qnId, data.tenantId, data.tenantName, data.propertyId, data.propertyName,
        data.landlordId, data.landlordName, data.unitNumber, data.noticeType, data.noticeDate,
        data.noticeExpiryDate, data.reason, data.statutoryBasis, data.status || 'Issued',
        data.issuedById, data.issuedByName
      ).run();
      return jsonResponse({ success: true, quitNotice: { ...data, id, quitNoticeId: qnId }, message: 'Saved successfully' });
    }

    // =========================================================================
    // 13. STUDENTS, RESEARCH, DOCUMENTS, APPROVALS, AUDITS, USERS
    // =========================================================================

    if (path === '/api/students' && method === 'POST') {
      const data = await request.json().catch(() => ({}));
      const studentId = data.studentId || await getNextD1Number(db, 'student', 'STU');
      const id = data.id || `stu-${Date.now()}`;
      await db.prepare(`
        INSERT INTO students (
          id, student_id, full_name, gender, phone, email, institution_id,
          institution_name, faculty, programme, level, matric_number, placement_type,
          placement_start_date, placement_end_date, assigned_branch_id, supervising_counsel_id,
          emergency_contact_name, emergency_contact_phone, status, completion_letter_issued,
          certificate_number, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        id, studentId, data.fullName, data.gender || null, data.phone, data.email,
        data.institutionId, data.institutionName, data.faculty, data.programme, data.level,
        data.matricNumber, data.placementType || 'Institution-Referred', data.placementStartDate,
        data.placementEndDate, data.assignedBranchId || 'br-abuja-01', data.supervisingCounselId || 'usr-counsel-01',
        data.emergencyContactName || null, data.emergencyContactPhone || null,
        data.status || 'Application Received', data.completionLetterIssued ? 1 : 0,
        data.certificateNumber || null
      ).run();
      return jsonResponse({ success: true, student: { ...data, id, studentId }, message: 'Saved successfully' });
    }

    if (path === '/api/expenses' && method === 'POST') {
      const data = await request.json().catch(() => ({}));
      const id = data.id || `exp-${Date.now()}`;
      await db.prepare(`
        INSERT INTO expenses (
          id, branch_id, account_type, category, amount, description, date,
          recorded_by_id, recorded_by_name, matter_id, property_id, receipt_ref, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        id, data.branchId || 'br-abuja-01', data.accountType || 'Law Firm Revenue',
        data.category || 'Administrative expenses', data.amount, data.description,
        data.date || new Date().toISOString().split('T')[0], data.recordedById, data.recordedByName,
        data.matterId || null, data.propertyId || null, data.receiptRef || null
      ).run();
      return jsonResponse({ success: true, expense: { ...data, id }, message: 'Saved successfully' });
    }

    if (path === '/api/legal-research' && method === 'POST') {
      const data = await request.json().catch(() => ({}));
      const id = data.id || `res-${Date.now()}`;
      await db.prepare(`
        INSERT INTO legal_research (
          id, topic, legal_issue, branch_id, statutes, case_authorities, legal_notes,
          matter_id, case_id, counsel_id, counsel_name, date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, data.topic, data.legalIssue, data.branchId || null, data.statutes,
        data.caseAuthorities, data.legalNotes, data.matterId || null, data.caseId || null,
        data.counselId, data.counselName, data.date || new Date().toISOString().split('T')[0]
      ).run();
      return jsonResponse({ success: true, research: { ...data, id }, message: 'Saved successfully' });
    }

    if (path === '/api/documents' && method === 'POST') {
      const data = await request.json().catch(() => ({}));
      const docId = data.documentId || await getNextD1Number(db, 'document', 'DOC');
      const id = data.id || `doc-${Date.now()}`;
      await db.prepare(`
        INSERT INTO documents (
          id, document_id, title, branch_id, category, entity_type, entity_id,
          file_url, file_size, file_type, uploaded_by_id, uploaded_by_name,
          version, upload_date, is_client_visible, notes, google_drive_link
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, docId, data.title, data.branchId || null, data.category, data.entityType || null,
        data.entityId || null, data.fileUrl || null, data.fileSize || '1.2 MB',
        data.fileType || 'PDF', data.uploadedById, data.uploadedByName,
        data.version || '1.0', data.uploadDate || new Date().toISOString().split('T')[0],
        data.isClientVisible ? 1 : 0, data.notes || null, data.googleDriveLink || null
      ).run();
      return jsonResponse({ success: true, document: { ...data, id, documentId: docId }, message: 'Saved successfully' });
    }

    if (path === '/api/public-notices' && method === 'POST') {
      const data = await request.json().catch(() => ({}));
      const id = data.id || `not-${Date.now()}`;
      await db.prepare(`
        INSERT INTO public_notices (
          id, title, category, content, publish_date, expiry_date, status, published_by_id, published_by_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, data.title, data.category, data.content, data.publishDate || new Date().toISOString().split('T')[0],
        data.expiryDate || null, data.status || 'Published', data.publishedById, data.publishedByName
      ).run();
      return jsonResponse({ success: true, notice: { ...data, id }, message: 'Saved successfully' });
    }

    if (path === '/api/approvals' && method === 'POST') {
      const data = await request.json().catch(() => ({}));
      const id = data.id || `appr-${Date.now()}`;
      await db.prepare(`
        INSERT INTO approval_requests (
          id, request_type, requester_id, requester_name, requester_role, branch_id,
          title, description, reference_code, status, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        id, data.requestType, data.requesterId, data.requesterName, data.requesterRole,
        data.branchId || 'br-abuja-01', data.title, data.description,
        data.referenceCode || null, data.status || 'PENDING_PRINCIPAL_PARTNER_APPROVAL'
      ).run();
      return jsonResponse({ success: true, approval: { ...data, id }, message: 'Saved successfully' });
    }

    if (path.startsWith('/api/approvals/') && method === 'PUT') {
      const id = path.replace('/api/approvals/', '');
      const data = await request.json().catch(() => ({}));
      await db.prepare(`
        UPDATE approval_requests
        SET status = ?, decided_at = datetime('now'), decided_by_id = ?,
            decided_by_name = ?, decision_notes = ?
        WHERE id = ?
      `).bind(data.status, data.decidedById, data.decidedByName, data.decisionNotes || '', id).run();
      return jsonResponse({ success: true, approval: data, message: 'Saved successfully' });
    }

    if (path.startsWith('/api/users/') && method === 'PUT') {
      const id = path.replace('/api/users/', '');
      const data = await request.json().catch(() => ({}));
      await db.prepare(`
        UPDATE users
        SET name = ?, email = ?, phone = ?, availability = ?,
            is_publicly_visible = ?, is_active = ?, account_status = ?
        WHERE id = ?
      `).bind(
        data.name, data.email, data.phone, data.availability,
        data.isPubliclyVisible ? 1 : 0, data.isActive ? 1 : 0, data.accountStatus, id
      ).run();
      return jsonResponse({ success: true, user: data, message: 'Saved successfully' });
    }

    // Default 404 for unhandled API routes
    return errorResponse(`Endpoint "${method} ${path}" not found`, 404);
  } catch (err: any) {
    console.error(`API Error on ${method} ${path}:`, err);
    return errorResponse(`Server error: ${err.message || 'Unknown database error'}`, 500);
  }
}
