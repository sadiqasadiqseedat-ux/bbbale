import { WorkerEnv, ExecutionContext, D1Database } from '../types/worker';

export type Env = WorkerEnv;
import { 
  User, 
  UserRole, 
  UserSession, 
  Client, 
  Consultation, 
  Matter, 
  CaseRecord, 
  CaseAssignment, 
  CourtDiaryEntry, 
  Task, 
  Invoice, 
  PaymentRecord, 
  Property, 
  Landlord, 
  Unit, 
  Tenant, 
  Tenancy, 
  QuitNotice, 
  StudentProfile, 
  DocumentRecord, 
  WebsiteContent, 
  AuditLog, 
  Branch,
  Receipt 
} from '../types';
import { hashPassword, verifyPassword, generateSalt, generateSecureToken, validatePasswordStrength, needsHashUpgrade } from '../services/crypto';
import {
  isFirmAdmin, canManageUsers, canManageWebsite, canAssignCases,
  canVerifyPayments, canApplyPaymentCorrection, canManageBilling, isPersonnel, getBranchFilter,
  filterByBranch, branchFilterClause, PAYMENT_VERIFIER_ROLES,
  MAX_FAILED_LOGIN_ATTEMPTS, LOGIN_LOCKOUT_MINUTES
} from './auth';
import type { InvoicePurpose, PaymentServiceType } from '../types';

// ---------------------------------------------------------------------------
// PAYMENT WORKFLOW CONSTANTS (single source of truth)
// ---------------------------------------------------------------------------
// A submitted receipt/bank reference is proof of submission only. These values
// are the only states the server will ever write for a payment or invoice.
const PAYMENT_STATUS_SUBMITTED = 'PAYMENT_SUBMITTED';
const PAYMENT_STATUS_VERIFIED = 'PAYMENT_VERIFIED';
const PAYMENT_STATUS_REJECTED = 'REJECTED';
const INVOICE_STATUS_UNPAID = 'UNPAID';

const PROPERTY_PAYMENT_PENDING = 'PENDING_PAYMENT';
const PROPERTY_PAYMENT_CONFIRMED = 'PAID_CONFIRMED';

// Maximum accepted length of an uploaded proof document (data-URL or URL) so a
// single submission cannot exhaust the D1 row budget.
const MAX_PROOF_LENGTH = 12 * 1024 * 1024;

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS
  });
}

function errorResponse(message: string, status: number = 400): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: CORS_HEADERS
  });
}

// Extract authenticated user from session token
async function getAuthUser(request: Request, db: D1Database): Promise<{ user: User; session: UserSession } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;

  try {
    const sessionRow = await db.prepare(
      `SELECT s.token, s.user_id, s.role, s.branch_id, s.expires_at, s.last_active_at,
              u.id, u.username, u.name, u.email, u.phone, u.role as user_role, u.branch_id as user_branch,
              u.title, u.practice_areas, u.bio, u.photo_url, u.availability, u.is_publicly_visible,
              u.is_active, u.account_status, u.requires_password_change, u.created_at
       FROM user_sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = ?`
    ).bind(token).first<any>();

    if (!sessionRow) return null;

    // Check expiry
    const expiresAt = new Date(sessionRow.expires_at).getTime();
    if (expiresAt < Date.now()) {
      await db.prepare('DELETE FROM user_sessions WHERE token = ?').bind(token).run();
      return null;
    }

    // Touch session
    await db.prepare(
      "UPDATE user_sessions SET last_active_at = datetime('now') WHERE token = ?"
    ).bind(token).run();

    const user: User = {
      id: sessionRow.id,
      username: sessionRow.username,
      name: sessionRow.name,
      email: sessionRow.email,
      phone: sessionRow.phone,
      role: sessionRow.user_role as UserRole,
      branchId: sessionRow.user_branch,
      title: sessionRow.title,
      practiceAreas: typeof sessionRow.practice_areas === 'string' ? JSON.parse(sessionRow.practice_areas || '[]') : [],
      bio: sessionRow.bio || '',
      photoUrl: sessionRow.photo_url || '',
      availability: sessionRow.availability || 'AVAILABLE',
      isPubliclyVisible: Boolean(sessionRow.is_publicly_visible),
      isActive: Boolean(sessionRow.is_active),
      accountStatus: sessionRow.account_status || 'Active',
      passwordHash: '',
      salt: '',
      requiresPasswordChange: Boolean(sessionRow.requires_password_change),
      failedLoginAttempts: 0,
      createdAt: sessionRow.created_at
    };

    const session: UserSession = {
      userId: sessionRow.user_id,
      token: sessionRow.token,
      role: sessionRow.role as UserRole,
      branchId: sessionRow.branch_id,
      rememberMe: true,
      expiresAt: sessionRow.expires_at,
      lastActiveAt: sessionRow.last_active_at
    };

    return { user, session };
  } catch (err) {
    console.error('Session lookup error:', err);
    return null;
  }
}

// Generate serial numbers using system_counters in D1
async function getNextNumber(db: D1Database, type: string, prefix: string): Promise<string> {
  try {
    await db.prepare(
      `INSERT INTO system_counters (id, type, current_count, updated_at)
       VALUES (?, ?, 1, datetime('now'))
       ON CONFLICT(type) DO UPDATE SET current_count = current_count + 1, updated_at = datetime('now');`
    ).bind(`cnt-${type}`, type).run();

    const row = await db.prepare('SELECT current_count FROM system_counters WHERE type = ?').bind(type).first<{ current_count: number }>();
    const count = row ? row.current_count : 1;
    const formatted = String(count).padStart(6, '0');
    return `BBC-${prefix}-2026-${formatted}`;
  } catch {
    const random = Math.floor(100000 + Math.random() * 900000);
    return `BBC-${prefix}-2026-${random}`;
  }
}

// Ensure database tables exist & seed default accounts if empty
async function ensureBootstrap(db: D1Database): Promise<void> {
  try {
    // Check if users exist
    const userCount = await db.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
    if (userCount && userCount.count > 0) {
      return; // Already bootstrapped
    }

    const defaultSetupPassword = 'admin@2026';

    // 1. Seed Branches
    await db.prepare(
      `INSERT OR IGNORE INTO branches (id, name, code, address, city, state, phone, email, is_active)
       VALUES 
       ('br-abuja-01', 'Abuja Head Chambers', 'ABJ', 'Plot 742, Gabriel Olusanya Crescent, CBD', 'Abuja', 'FCT', '+234 9 291 8000', 'abuja@bbbalechambers.ng', 1),
       ('br-lagos-02', 'Lagos Island Chambers', 'LOS', '14th Floor, Investment House, Broad Street', 'Lagos', 'Lagos State', '+234 1 454 9200', 'lagos@bbbalechambers.ng', 1),
       ('br-kano-03', 'Kano Commercial Chambers', 'KAN', 'Suite 404, Gidan Goldie, Nassarawa GRA', 'Kano', 'Kano State', '+234 64 982 110', 'kano@bbbalechambers.ng', 1),
       ('br-ph-04', 'Port Harcourt Branch', 'PHC', '8 Forces Avenue, Old GRA', 'Port Harcourt', 'Rivers State', '+234 84 301 440', 'portharcourt@bbbalechambers.ng', 1);`
    ).run();

    // 2. Seed Initial 5 Authorized Accounts
    const initialUsers = [
      {
        id: 'usr-principal-01',
        username: 'principal.partner',
        name: 'Barrister B. B. Bale, SAN, FCIArb',
        email: 'principal@bbbalechambers.ng',
        phone: '+234 803 200 1100',
        role: 'PRINCIPAL_PARTNER',
        branchId: 'br-abuja-01',
        title: 'Senior Advocate of Nigeria / Principal Partner',
        practiceAreas: JSON.stringify(['Constitutional Litigation', 'Appellate Advocacy', 'Energy & Natural Resources', 'Commercial Arbitration']),
        bio: 'Founding Partner and Senior Advocate of Nigeria with over three decades of exceptional legal practice.',
        photoUrl: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=600',
        salt: 'a1b2c3d4e5f60718'
      },
      {
        id: 'usr-hoc-01',
        username: 'head.chamber',
        name: 'Barrister Aisha M. Bello, LL.M',
        email: 'hoc.abuja@bbbalechambers.ng',
        phone: '+234 802 333 4455',
        role: 'HEAD_OF_CHAMBER',
        branchId: 'br-abuja-01',
        title: 'Partner / Head of Chamber (Abuja)',
        practiceAreas: JSON.stringify(['Corporate & Commercial', 'Property & Real Estate Law', 'Islamic Jurisprudence']),
        bio: 'Partner directing the day-to-day legal operations of the Abuja Head Chambers.',
        photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600',
        salt: 'b2c3d4e5f6071829'
      },
      {
        id: 'usr-admin-01',
        username: 'administrator',
        name: 'Fatima Garba, B.Sc, CIPM',
        email: 'secretary@bbbalechambers.ng',
        phone: '+234 809 555 1212',
        role: 'ADMINISTRATOR_SECRETARY',
        branchId: 'br-abuja-01',
        title: 'Chambers Administrator & Legal Secretary',
        practiceAreas: JSON.stringify(['Court Filings & Cause Lists', 'Client Intake', 'Legal Drafting Management']),
        bio: 'Oversees chambers intake and secretarial administration.',
        photoUrl: 'https://images.unsplash.com/photo-1580894732454-defa48f40742?auto=format&fit=crop&q=80&w=600',
        salt: 'c3d4e5f60718293a'
      },
      {
        id: 'usr-accounts-01',
        username: 'accounts',
        name: 'Chukwudi Nnamdi, ACA',
        email: 'accounts@bbbalechambers.ng',
        phone: '+234 805 777 8899',
        role: 'ACCOUNT_OFFICER',
        branchId: 'br-abuja-01',
        title: 'Principal Financial Accountant',
        practiceAreas: JSON.stringify(['Client Escrow Management', 'Retainer Accounting', 'Tax & Compliance']),
        bio: 'Directs billing, fee notes, and financial accounting.',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
        salt: 'd4e5f60718293a4b'
      },
      {
        id: 'usr-counsel-01',
        username: 'counsel',
        name: 'Barrister Tunde Adeleke, BL',
        email: 'tunde.adeleke@bbbalechambers.ng',
        phone: '+234 813 444 7788',
        role: 'COUNSEL_STAFF',
        branchId: 'br-abuja-01',
        title: 'Senior Litigation & Property Associate',
        practiceAreas: JSON.stringify(['Recovery of Premises', 'High Court Litigation', 'Tenancy Disputes']),
        bio: 'Accomplished trial advocate specializing in tenancy litigation.',
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600',
        salt: 'e5f60718293a4b5c'
      }
    ];

    for (const u of initialUsers) {
      const hash = await hashPassword(defaultSetupPassword, u.salt);
      await db.prepare(
        `INSERT OR IGNORE INTO users 
         (id, username, name, email, phone, role, branch_id, title, practice_areas, bio, photo_url, availability, is_publicly_visible, is_active, account_status, password_hash, salt, requires_password_change)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 'Active', ?, ?, 1)`
      ).bind(
        u.id, u.username, u.name, u.email, u.phone, u.role, u.branchId, u.title,
        u.practiceAreas, u.bio, u.photoUrl || '', 'AVAILABLE', hash, u.salt
      ).run();
    }

    // 3. Seed Website CMS Content
    await db.prepare(
      `INSERT OR IGNORE INTO website_content 
       (id, tagline, hero_headline, hero_subheadline, about_story, about_founding_year, office_hours_text, emergency_hotline, consultation_fee_standard, internship_policy_notice, recovery_of_premises_notice, invoice_bank_name, invoice_account_name, invoice_account_number, invoice_payment_method, last_updated, updated_by)
       VALUES 
       ('cms-main', 'Secure. Organized. Professional.', 'Secure. Organized. Professional.',
        'Distinguished legal representation, trial advocacy, property & recovery of premises management, Islamic law jurisprudence, and institutional law-student mentorship across Nigeria.',
        'B. B. BALE & CO. CHAMBERS was established to provide distinguished corporate entities, institutions, and individuals with uncompromising legal defense and advisory services.',
        '1996', 'Mondays through Fridays: 8:00 AM - 5:30 PM. In-person client conferences and virtual consultations are scheduled upon verified booking.',
        '+234 803 200 1100', 35000,
        'Chambers welcomes Bar Part II externs from the Nigerian Law School and law undergraduates from recognized universities.',
        'Statutory notice periods must not be mechanically applied; each notice is formulated in accordance with applicable State tenancy legislation.',
        'First Bank of Nigeria PLC', 'B. B. BALE & CO. (CLIENT SERVICES)', '2039485712', 'Bank Transfer',
        datetime('now'), 'Chambers Administration');`
    ).run();

  } catch (err) {
    console.error('Bootstrap error (non-fatal):', err);
  }
}

// Log audit trail to D1
async function logAudit(
  db: D1Database,
  userId: string,
  userName: string,
  userRole: string,
  action: string,
  entity: string,
  entityId: string,
  details: string
): Promise<void> {
  try {
    await db.prepare(
      `INSERT INTO audit_logs (id, timestamp, user_id, user_name, user_role, action, entity, entity_id, details)
       VALUES (?, datetime('now'), ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      userName,
      userRole,
      action,
      entity,
      entityId,
      details
    ).run();
  } catch (e) {
    console.error('Audit log failed:', e);
  }
}

/**
 * Main Cloudflare Worker API router
 */
export async function handleApiRequest(
  request: Request,
  env: WorkerEnv,
  _ctx?: ExecutionContext
): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  const path = url.pathname;
  const db = env.DB;

  if (!db) {
    return errorResponse('Cloudflare D1 database binding "DB" is not available in environment.', 500);
  }

  // Ensure bootstrap on first hit
  await ensureBootstrap(db);

  try {
    // --------------------------------------------------------------------------
    // 1. HEALTH & STATUS
    // --------------------------------------------------------------------------
    if (path === '/api/health') {
      const clientCount = await db.prepare('SELECT COUNT(*) as count FROM clients').first<{ count: number }>().catch(() => ({ count: 0 }));
      const userCount = await db.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>().catch(() => ({ count: 0 }));
      const caseCount = await db.prepare('SELECT COUNT(*) as count FROM cases').first<{ count: number }>().catch(() => ({ count: 0 }));
      const invoiceCount = await db.prepare('SELECT COUNT(*) as count FROM invoices').first<{ count: number }>().catch(() => ({ count: 0 }));

      return jsonResponse({
        success: true,
        status: 'healthy',
        database: 'Cloudflare D1 (binding: DB)',
        timestamp: new Date().toISOString(),
        counts: {
          users: userCount?.count || 0,
          clients: clientCount?.count || 0,
          cases: caseCount?.count || 0,
          invoices: invoiceCount?.count || 0
        }
      });
    }

    // --------------------------------------------------------------------------
    // 2. AUTHENTICATION
    // --------------------------------------------------------------------------
    if (path === '/api/auth/login' && request.method === 'POST') {
      const body = await request.json() as any;
      const identifier = (body.identifier || '').trim().toLowerCase();
      const password = body.password || '';

      if (!identifier || !password) {
        return errorResponse('Username/email and password are required.');
      }

      // Find user
      let userRow = await db.prepare(
        'SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?'
      ).bind(identifier, identifier).first<any>();

      // Check role aliases if not found
      if (!userRow) {
        let roleMatch = '';
        if (['principal.partner', 'principal_partner', 'principal', 'admin'].includes(identifier)) roleMatch = 'PRINCIPAL_PARTNER';
        if (['head.chamber', 'head_of_chamber', 'head'].includes(identifier)) roleMatch = 'HEAD_OF_CHAMBER';
        if (['administrator', 'administrator_secretary', 'secretary'].includes(identifier)) roleMatch = 'ADMINISTRATOR_SECRETARY';
        if (['accounts', 'account_officer', 'account'].includes(identifier)) roleMatch = 'ACCOUNT_OFFICER';
        if (['counsel', 'counsel_staff'].includes(identifier)) roleMatch = 'COUNSEL_STAFF';

        if (roleMatch) {
          userRow = await db.prepare('SELECT * FROM users WHERE role = ? LIMIT 1').bind(roleMatch).first<any>();
        }
      }

      if (!userRow) {
        await logAudit(db, 'system', identifier, 'PUBLIC', 'LOGIN_FAILED', 'User', identifier, 'User not found');
        return errorResponse('Invalid username/email or password.', 401);
      }

      if (userRow.account_status === 'Suspended') {
        return errorResponse('Account suspended. Please consult the Principal Partner.', 403);
      }
      if (!userRow.is_active || userRow.account_status === 'Inactive') {
        return errorResponse('Account is deactivated. Please consult Chambers Administration.', 403);
      }

      // Check for account lockout due to excessive failed attempts
      if (userRow.failed_login_attempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
        const lastLoginAttempt = userRow.last_login;
        if (lastLoginAttempt) {
          const lockoutExpiry = new Date(lastLoginAttempt).getTime() + (LOGIN_LOCKOUT_MINUTES * 60 * 1000);
          if (Date.now() < lockoutExpiry) {
            return errorResponse(`Account temporarily locked due to multiple failed attempts. Please try again in ${LOGIN_LOCKOUT_MINUTES} minutes or contact the Principal Partner.`, 429);
          }
          // Reset counter after lockout period expires
          await db.prepare('UPDATE users SET failed_login_attempts = 0 WHERE id = ?').bind(userRow.id).run();
        }
      }

      // Verify password (supports both new PBKDF2 and legacy SHA-256 hashes)
      let isPasswordValid = await verifyPassword(password, userRow.salt, userRow.password_hash);

      // SECURITY FIX: The old admin@2026 bootstrap bypass has been removed.
      // Users with requires_password_change=1 must authenticate with their actual password,
      // then change it. New seeded accounts use PBKDF2-hashed admin@2026 as their initial password.

      // Transparently upgrade legacy SHA-256 hashes to PBKDF2 on successful login
      if (isPasswordValid && needsHashUpgrade(userRow.password_hash)) {
        const newSalt = generateSalt();
        const newHash = await hashPassword(password, newSalt);
        await db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').bind(newHash, newSalt, userRow.id).run();
      }

      if (!isPasswordValid) {
        await db.prepare(
          "UPDATE users SET failed_login_attempts = failed_login_attempts + 1, last_login = datetime('now') WHERE id = ?"
        ).bind(userRow.id).run();
        await logAudit(db, userRow.id, userRow.name, userRow.role, 'LOGIN_FAILED', 'User', userRow.id, 'Incorrect password');
        return errorResponse('Invalid username/email or password.', 401);
      }

      // Reset failed attempts & set last_login
      await db.prepare(
        "UPDATE users SET failed_login_attempts = 0, last_login = datetime('now') WHERE id = ?"
      ).bind(userRow.id).run();

      // Create session in user_sessions
      const token = generateSecureToken(32);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      await db.prepare(
        `INSERT INTO user_sessions (token, user_id, role, branch_id, expires_at, created_at, last_active_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      ).bind(token, userRow.id, userRow.role, userRow.branch_id, expiresAt).run();

      await logAudit(db, userRow.id, userRow.name, userRow.role, 'LOGIN_SUCCESS', 'Session', token, 'User logged in successfully');

      const user: User = {
        id: userRow.id,
        username: userRow.username,
        name: userRow.name,
        email: userRow.email,
        phone: userRow.phone,
        role: userRow.role as UserRole,
        branchId: userRow.branch_id,
        title: userRow.title,
        practiceAreas: typeof userRow.practice_areas === 'string' ? JSON.parse(userRow.practice_areas || '[]') : [],
        bio: userRow.bio || '',
        photoUrl: userRow.photo_url || '',
        availability: userRow.availability || 'AVAILABLE',
        isPubliclyVisible: Boolean(userRow.is_publicly_visible),
        isActive: Boolean(userRow.is_active),
        accountStatus: userRow.account_status,
        passwordHash: '',
        salt: '',
        requiresPasswordChange: Boolean(userRow.requires_password_change),
        failedLoginAttempts: 0,
        createdAt: userRow.created_at
      };

      const session: UserSession = {
        userId: userRow.id,
        token,
        role: userRow.role as UserRole,
        branchId: userRow.branch_id,
        rememberMe: true,
        expiresAt,
        lastActiveAt: new Date().toISOString()
      };

      return jsonResponse({
        success: true,
        user,
        session,
        requiresPasswordChange: user.requiresPasswordChange
      });
    }

    if (path === '/api/auth/me' && request.method === 'GET') {
      const auth = await getAuthUser(request, db);
      if (!auth) {
        return errorResponse('Unauthorized or session expired', 401);
      }
      return jsonResponse({ success: true, user: auth.user, session: auth.session });
    }

    if (path === '/api/auth/logout' && request.method === 'POST') {
      const auth = await getAuthUser(request, db);
      if (auth) {
        await db.prepare('DELETE FROM user_sessions WHERE token = ?').bind(auth.session.token).run();
        await logAudit(db, auth.user.id, auth.user.name, auth.user.role, 'LOGOUT', 'Session', auth.session.token, 'User logged out');
      }
      return jsonResponse({ success: true });
    }

    if (path === '/api/auth/change-password' && request.method === 'POST') {
      const auth = await getAuthUser(request, db);
      if (!auth) return errorResponse('Unauthorized', 401);

      const body = await request.json() as any;
      const { currentPassword, newPassword } = body;

      const userRow = await db.prepare('SELECT salt, password_hash FROM users WHERE id = ?').bind(auth.user.id).first<any>();
      if (!userRow) return errorResponse('User record not found', 404);

      const isCurrentValid = await verifyPassword(currentPassword, userRow.salt, userRow.password_hash);
      if (!isCurrentValid) {
        return errorResponse('Current password does not match our records.', 400);
      }

      const strength = validatePasswordStrength(newPassword);
      if (!strength.isValid) {
        return errorResponse(strength.errors[0], 400);
      }

      const newSalt = generateSalt();
      const newHash = await hashPassword(newPassword, newSalt);

      await db.prepare(
        `UPDATE users 
         SET salt = ?, password_hash = ?, requires_password_change = 0, 
             account_status = 'Active', password_changed_at = datetime('now')
         WHERE id = ?`
      ).bind(newSalt, newHash, auth.user.id).run();

      await logAudit(db, auth.user.id, auth.user.name, auth.user.role, 'CHANGE_PASSWORD', 'User', auth.user.id, 'User changed password');
      return jsonResponse({ success: true, message: 'Password updated successfully' });
    }

    // Admin-initiated password reset (Principal Partner or Head of Chamber only)
    if (path === '/api/auth/admin-reset-password' && request.method === 'POST') {
      const auth = await getAuthUser(request, db);
      if (!auth) return errorResponse('Unauthorized', 401);
      if (!canManageUsers(auth.user)) {
        return errorResponse('Forbidden: Only Principal Partner or Head of Chamber can reset user passwords.', 403);
      }

      const body = await request.json() as any;
      const { targetUserId, temporaryPassword } = body;

      if (!targetUserId || !temporaryPassword) {
        return errorResponse('Target user ID and temporary password are required.', 400);
      }

      const targetUser = await db.prepare('SELECT id, name, role FROM users WHERE id = ?').bind(targetUserId).first<any>();
      if (!targetUser) return errorResponse('Target user not found.', 404);

      // Principal Partner account can only be reset by the Principal Partner themselves
      if (targetUser.role === 'PRINCIPAL_PARTNER' && auth.user.role !== 'PRINCIPAL_PARTNER') {
        return errorResponse('Forbidden: Only the Principal Partner can reset their own credentials.', 403);
      }

      const strength = validatePasswordStrength(temporaryPassword);
      if (!strength.isValid) {
        return errorResponse('Temporary password does not meet strength requirements: ' + strength.errors[0], 400);
      }

      const newSalt = generateSalt();
      const newHash = await hashPassword(temporaryPassword, newSalt);

      await db.prepare(
        `UPDATE users 
         SET salt = ?, password_hash = ?, requires_password_change = 1, 
             account_status = 'Password Reset Required', password_changed_at = datetime('now')
         WHERE id = ?`
      ).bind(newSalt, newHash, targetUserId).run();

      // Invalidate all existing sessions for the target user
      await db.prepare('DELETE FROM user_sessions WHERE user_id = ?').bind(targetUserId).run().catch(() => {});

      await logAudit(db, auth.user.id, auth.user.name, auth.user.role, 'ADMIN_PASSWORD_RESET', 'User', targetUserId, `Reset password for ${targetUser.name}`);
      return jsonResponse({ success: true, message: 'Password reset successfully. User must change password on next login.' });
    }

    // --------------------------------------------------------------------------
    // 3. MULTI-DEVICE FULL SYNC (AUTHENTICATED & ROLE-FILTERED)
    // --------------------------------------------------------------------------
    if (path === '/api/sync' && request.method === 'GET') {
      // SECURITY FIX: /api/sync now requires authentication
      const auth = await getAuthUser(request, db);
      if (!auth) {
        return errorResponse('Unauthorized: Valid personnel login required to sync data.', 401);
      }

      const branchFilter = getBranchFilter(auth.user);

      // Build branch-filtered WHERE clause for queries that have branch_id
      const bf = branchFilter ? `WHERE branch_id = ?` : '';
      const bfParams = branchFilter ? [branchFilter] : [];

      // Branches: all active branches for PRINCIPAL_PARTNER, own branch only for others
      const branchesQuery = branchFilter
        ? 'SELECT * FROM branches WHERE is_active = 1 AND id = ?'
        : 'SELECT * FROM branches WHERE is_active = 1';
      const branches = branchFilter
        ? await db.prepare(branchesQuery).bind(branchFilter).all<any>()
        : await db.prepare(branchesQuery).all<any>();

      // Users: PRINCIPAL_PARTNER sees all; others see only users in their branch
      const usersQuery = branchFilter
        ? 'SELECT id, username, name, email, phone, role, branch_id, title, practice_areas, bio, photo_url, availability, is_publicly_visible, is_active, account_status, requires_password_change, created_at FROM users WHERE branch_id = ?'
        : 'SELECT id, username, name, email, phone, role, branch_id, title, practice_areas, bio, photo_url, availability, is_publicly_visible, is_active, account_status, requires_password_change, created_at FROM users';
      const users = branchFilter
        ? await db.prepare(usersQuery).bind(branchFilter).all<any>()
        : await db.prepare(usersQuery).all<any>();

      // Courts and institutions are reference data — visible to all authenticated users
      const courts = await db.prepare('SELECT * FROM courts').all<any>().catch(() => ({ results: [] }));
      const institutions = await db.prepare('SELECT * FROM partner_institutions').all<any>().catch(() => ({ results: [] }));

      // Branch-filtered queries
      const clients = branchFilter
        ? await db.prepare('SELECT * FROM clients WHERE branch_id = ? ORDER BY date_registered DESC').bind(branchFilter).all<any>()
        : await db.prepare('SELECT * FROM clients ORDER BY date_registered DESC').all<any>();

      const consultations = branchFilter
        ? await db.prepare('SELECT * FROM consultations WHERE branch_id = ? ORDER BY created_at DESC').bind(branchFilter).all<any>()
        : await db.prepare('SELECT * FROM consultations ORDER BY created_at DESC').all<any>();

      const matters = branchFilter
        ? await db.prepare('SELECT * FROM matters WHERE branch_id = ? ORDER BY created_at DESC').bind(branchFilter).all<any>()
        : await db.prepare('SELECT * FROM matters ORDER BY created_at DESC').all<any>();

      const cases = branchFilter
        ? await db.prepare('SELECT * FROM cases WHERE branch_id = ? ORDER BY created_at DESC').bind(branchFilter).all<any>()
        : await db.prepare('SELECT * FROM cases ORDER BY created_at DESC').all<any>();

      const caseAssignments = branchFilter
        ? await db.prepare('SELECT * FROM case_assignments WHERE branch_id = ? ORDER BY date_assigned DESC').bind(branchFilter).all<any>()
        : await db.prepare('SELECT * FROM case_assignments ORDER BY date_assigned DESC').all<any>();

      const courtDiary = branchFilter
        ? await db.prepare('SELECT * FROM court_diary WHERE branch_id = ? ORDER BY court_date ASC').bind(branchFilter).all<any>()
        : await db.prepare('SELECT * FROM court_diary ORDER BY court_date ASC').all<any>();

      const tasks = branchFilter
        ? await db.prepare('SELECT * FROM tasks WHERE branch_id = ? ORDER BY due_date ASC').bind(branchFilter).all<any>()
        : await db.prepare('SELECT * FROM tasks ORDER BY due_date ASC').all<any>();

      const properties = branchFilter
        ? await db.prepare('SELECT * FROM properties WHERE branch_id = ? ORDER BY created_at DESC').bind(branchFilter).all<any>()
        : await db.prepare('SELECT * FROM properties ORDER BY created_at DESC').all<any>();

      // Landlords don't have branch_id column in all schema versions — filter via properties if needed
      const landlords = await db.prepare('SELECT * FROM landlords ORDER BY date_registered DESC').all<any>();
      const units = await db.prepare('SELECT * FROM units').all<any>().catch(() => ({ results: [] }));
      const tenants = await db.prepare('SELECT * FROM tenants ORDER BY date_registered DESC').all<any>();
      const tenancies = await db.prepare('SELECT * FROM tenancies').all<any>().catch(() => ({ results: [] }));
      const rentRecords = await db.prepare('SELECT * FROM rent_records').all<any>().catch(() => ({ results: [] }));
      const quitNotices = await db.prepare('SELECT * FROM quit_notices ORDER BY created_at DESC').all<any>();

      const invoices = branchFilter
        ? await db.prepare('SELECT * FROM invoices WHERE branch_id = ? ORDER BY created_at DESC').bind(branchFilter).all<any>()
        : await db.prepare('SELECT * FROM invoices ORDER BY created_at DESC').all<any>();

      const payments = branchFilter
        ? await db.prepare('SELECT * FROM payments WHERE branch_id = ? ORDER BY submitted_at DESC').bind(branchFilter).all<any>()
        : await db.prepare('SELECT * FROM payments ORDER BY submitted_at DESC').all<any>();

      const receipts = await db.prepare('SELECT * FROM receipts ORDER BY issued_date DESC').all<any>().catch(() => ({ results: [] }));

      const expenses = branchFilter
        ? await db.prepare('SELECT * FROM expenses WHERE branch_id = ? ORDER BY created_at DESC').bind(branchFilter).all<any>().catch(() => ({ results: [] }))
        : await db.prepare('SELECT * FROM expenses ORDER BY created_at DESC').all<any>().catch(() => ({ results: [] }));

      const students = branchFilter
        ? await db.prepare('SELECT * FROM students WHERE assigned_branch_id = ? ORDER BY created_at DESC').bind(branchFilter).all<any>()
        : await db.prepare('SELECT * FROM students ORDER BY created_at DESC').all<any>();

      const documents = branchFilter
        ? await db.prepare('SELECT * FROM documents WHERE branch_id = ? ORDER BY upload_date DESC').bind(branchFilter).all<any>()
        : await db.prepare('SELECT * FROM documents ORDER BY upload_date DESC').all<any>();

      let correspondence: any = { results: [] };
      try {
        correspondence = branchFilter
          ? await db.prepare('SELECT * FROM correspondence WHERE branch_id = ? ORDER BY created_at DESC').bind(branchFilter).all<any>()
          : await db.prepare('SELECT * FROM correspondence ORDER BY created_at DESC').all<any>();
      } catch {
        try {
          correspondence = await db.prepare('SELECT * FROM correspondence ORDER BY date DESC').all<any>();
        } catch {
          try {
            correspondence = await db.prepare('SELECT * FROM correspondence').all<any>();
          } catch {
            correspondence = { results: [] };
          }
        }
      }
      const legalResearch = await db.prepare('SELECT * FROM legal_research ORDER BY date DESC').all<any>();
      const appointments = await db.prepare('SELECT * FROM appointments ORDER BY date ASC').all<any>().catch(() => ({ results: [] }));
      const publicNotices = await db.prepare('SELECT * FROM public_notices ORDER BY publish_date DESC').all<any>();
      const publicEnquiries = await db.prepare('SELECT * FROM public_enquiries ORDER BY created_at DESC').all<any>().catch(() => ({ results: [] }));
      const approvals = branchFilter
        ? await db.prepare('SELECT * FROM approvals WHERE branch_id = ? ORDER BY submitted_at DESC').bind(branchFilter).all<any>().catch(() => ({ results: [] }))
        : await db.prepare('SELECT * FROM approvals ORDER BY submitted_at DESC').all<any>().catch(() => ({ results: [] }));
      const websiteContent = await db.prepare("SELECT * FROM website_content WHERE id = 'cms-main'").first<any>();

      // Audit logs: PRINCIPAL_PARTNER sees all, others see only their own actions
      const auditLogs = branchFilter
        ? await db.prepare('SELECT * FROM audit_logs WHERE user_id IN (SELECT id FROM users WHERE branch_id = ?) ORDER BY timestamp DESC LIMIT 100').bind(branchFilter).all<any>()
        : await db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100').all<any>();

      return jsonResponse({
        success: true,
        timestamp: new Date().toISOString(),
        data: {
          branches: branches.results || [],
          users: (users.results || []).map(u => ({
            ...u,
            branchId: u.branch_id,
            photoUrl: u.photo_url || '',
            accountStatus: u.account_status || 'Active',
            practiceAreas: typeof u.practice_areas === 'string' ? JSON.parse(u.practice_areas || '[]') : [],
            isPubliclyVisible: Boolean(u.is_publicly_visible),
            isActive: Boolean(u.is_active),
            requiresPasswordChange: Boolean(u.requires_password_change)
          })),
          courts: courts.results || [],
          institutions: institutions.results || [],
          clients: (clients.results || []).map(c => ({
            ...c,
            clientId: c.client_id,
            fullName: c.full_name,
            clientType: c.client_type,
            branchId: c.branch_id,
            assignedLawyerId: c.assigned_lawyer_id,
            conflictCheckStatus: c.conflict_check_status,
            conflictCheckNotes: c.conflict_check_notes,
            dateRegistered: c.date_registered,
            isActive: Boolean(c.is_active),
            confidentialNotes: c.confidential_notes
          })),
          consultations: (consultations.results || []).map(cons => ({
            ...cons,
            serviceCategory: cons.service_category,
            preferredDate: cons.preferred_date,
            preferredTime: cons.preferred_time,
            fullName: cons.full_name,
            briefEnquiry: cons.brief_enquiry,
            supportingDocuments: typeof cons.supporting_documents === 'string' ? JSON.parse(cons.supporting_documents || '[]') : [],
            invoiceNumber: cons.invoice_number,
            paymentReference: cons.payment_reference,
            branchId: cons.branch_id,
            assignedLawyerId: cons.assigned_lawyer_id,
            clientVisibleUpdate: cons.client_visible_update,
            createdAt: cons.created_at
          })),
          matters: (matters.results || []).map(m => ({
            ...m,
            matterId: m.matter_id,
            clientId: m.client_id,
            branchId: m.branch_id,
            leadCounselId: m.lead_counsel_id,
            engagementDate: m.engagement_date,
            clientVisibleUpdate: m.client_visible_update,
            privilegedInternalNotes: m.privileged_internal_notes,
            requiresPrincipalApproval: Boolean(m.requires_principal_approval),
            principalApprovalStatus: m.principal_approval_status,
            createdAt: m.created_at
          })),
          cases: (cases.results || []).map(cs => ({
            ...cs,
            caseId: cs.case_id,
            suitNumber: cs.suit_number,
            matterId: cs.matter_id,
            clientId: cs.client_id,
            branchId: cs.branch_id,
            courtId: cs.court_id,
            judicialDivision: cs.judicial_division,
            counselId: cs.counsel_id,
            opposingParty: cs.opposing_party,
            opposingCounsel: cs.opposing_counsel,
            caseType: cs.case_type,
            subjectMatter: cs.subject_matter,
            filingDate: cs.filing_date,
            nextCourtDate: cs.next_court_date,
            clientVisibleUpdate: cs.client_visible_update,
            internalStrategyNotes: cs.internal_strategy_notes,
            createdAt: cs.created_at
          })),
          caseAssignments: (caseAssignments.results || []).map(a => ({
            ...a,
            caseId: a.case_id,
            suitNumber: a.suit_number,
            branchId: a.branch_id,
            counselId: a.counsel_id,
            assignedById: a.assigned_by_id,
            assignedByName: a.assigned_by_name,
            dateAssigned: a.date_assigned,
            rejectionReason: a.rejection_reason,
            rejectionNotes: a.rejection_notes,
            responseDate: a.response_date
          })),
          courtDiary: (courtDiary.results || []).map(cd => ({
            ...cd,
            caseId: cd.case_id,
            suitNumber: cd.suit_number,
            branchId: cd.branch_id,
            courtDate: cd.court_date,
            courtTime: cd.court_time,
            courtName: cd.court_name,
            counselId: cd.counsel_id,
            clientId: cd.client_id,
            outcomeSummary: cd.outcome_summary,
            nextCourtDate: cd.next_court_date
          })),
          tasks: (tasks.results || []).map(t => ({
            ...t,
            assignedToId: t.assigned_to_id,
            assignedById: t.assigned_by_id,
            branchId: t.branch_id,
            matterId: t.matter_id,
            caseId: t.case_id,
            dueDate: t.due_date,
            completionDate: t.completion_date,
            createdAt: t.created_at
          })),
          properties: (properties.results || []).map(p => ({
            ...p,
            propertyId: p.property_id,
            branchId: p.branch_id,
            propertyType: p.property_type,
            imageUrl: p.image_url || '',
            // A missing status must never be reported as paid.
            registrationPaymentStatus: p.registration_payment_status || PROPERTY_PAYMENT_PENDING,
            registrationFee: p.registration_fee !== undefined ? Number(p.registration_fee) : 50000,
            landlordId: p.landlord_id,
            totalUnits: p.total_units,
            titleInformation: p.title_information,
            surveyInformation: p.survey_information,
            legalStatus: p.legal_status,
            assignedLawyerId: p.assigned_lawyer_id,
            relatedClientId: p.related_client_id,
            relatedMatterId: p.related_matter_id,
            createdAt: p.created_at
          })),
          landlords: (landlords.results || []).map(l => ({
            ...l,
            landlordId: l.landlord_id,
            branchId: l.branch_id,
            fullName: l.full_name,
            bankDetails: l.bank_details,
            trackingCode: l.tracking_code,
            dateRegistered: l.date_registered
          })),
          units: (units.results || []).map(u => ({
            ...u,
            propertyId: u.property_id,
            unitNumber: u.unit_number,
            unitType: u.unit_type,
            rentalFee: u.rental_fee,
            currentTenantId: u.current_tenant_id,
            createdAt: u.created_at
          })),
          tenants: (tenants.results || []).map(t => ({
            ...t,
            tenantId: t.tenant_id,
            fullName: t.full_name,
            landlordId: t.landlord_id,
            propertyId: t.property_id,
            unitNumber: t.unit_number,
            trackingCode: t.tracking_code,
            dateRegistered: t.date_registered
          })),
          tenancies: (tenancies.results || []).map(ten => ({
            ...ten,
            tenantId: ten.tenant_id,
            propertyId: ten.property_id,
            unitNumber: ten.unit_number,
            rentAmount: ten.rent_amount,
            startDate: ten.start_date,
            expiryDate: ten.expiry_date,
            paymentFrequency: ten.payment_frequency,
            arrearsAmount: ten.arrears_amount,
            tenancyAgreementDocId: ten.tenancy_agreement_doc_id
          })),
          rentRecords: rentRecords.results || [],
          quitNotices: (quitNotices.results || []).map(q => ({
            ...q,
            quitNoticeId: q.quit_notice_id,
            tenantId: q.tenant_id,
            tenantName: q.tenant_name,
            propertyId: q.property_id,
            propertyName: q.property_name,
            landlordId: q.landlord_id,
            landlordName: q.landlord_name,
            unitNumber: q.unit_number,
            noticeType: q.notice_type,
            noticeDate: q.notice_date,
            noticeExpiryDate: q.notice_expiry_date,
            statutoryBasis: q.statutory_basis,
            issuedById: q.issued_by_id,
            issuedByName: q.issued_by_name,
            createdAt: q.created_at
          })),
          invoices: (invoices.results || []).map(inv => ({
            ...inv,
            invoiceNumber: inv.invoice_number,
            clientId: inv.client_id,
            clientName: inv.client_name,
            clientEmail: inv.client_email,
            clientPhone: inv.client_phone,
            matterId: inv.matter_id,
            branchId: inv.branch_id,
            consultationId: inv.consultation_id,
            consultationCode: inv.consultation_code,
            purpose: inv.purpose || null,
            serviceType: inv.service_type || null,
            serviceRef: inv.service_ref || null,
            propertyId: inv.property_id || null,
            landlordId: inv.landlord_id || null,
            items: typeof inv.items === 'string' ? JSON.parse(inv.items || '[]') : [],
            taxAmount: inv.tax_amount,
            totalAmount: inv.total_amount,
            dueDate: inv.due_date,
            paymentStatus: inv.payment_status,
            approvalStatus: inv.approval_status,
            approvalRequestId: inv.approval_request_id,
            approvalNotes: inv.approval_notes,
            paymentReference: inv.payment_reference,
            paymentMethod: inv.payment_method,
            createdAt: inv.created_at
          })),
          payments: (payments.results || []).map(p => ({
            ...p,
            paymentReference: p.payment_reference,
            invoiceNumber: p.invoice_number,
            invoiceId: p.invoice_id || null,
            serviceType: p.service_type || null,
            serviceRef: p.service_ref || null,
            clientName: p.client_name,
            branchId: p.branch_id,
            paymentMethod: p.payment_method,
            paymentDate: p.payment_date,
            bankTransactionRef: p.bank_transaction_ref,
            receiptNumber: p.receipt_number,
            verifiedById: p.verified_by_id,
            verifiedByName: p.verified_by_name,
            verificationDate: p.verification_date,
            verificationNotes: p.verification_notes,
            proofDocumentUrl: p.proof_document_url,
            submittedAt: p.submitted_at
          })),
          receipts: (receipts.results || []).map((r: any) => ({
            id: r.id,
            receiptNumber: r.receipt_number,
            paymentReference: r.payment_reference,
            invoiceNumber: r.invoice_number,
            clientName: r.client_name,
            amount: Number(r.amount),
            paymentMethod: r.payment_method,
            issuedDate: r.issued_date,
            issuedById: r.issued_by_id,
            issuedByName: r.issued_by_name,
            createdAt: r.created_at
          })),
          expenses: expenses.results || [],
          students: (students.results || []).map(s => ({
            ...s,
            studentId: s.student_id,
            fullName: s.full_name,
            institutionId: s.institution_id,
            institutionName: s.institution_name,
            matricNumber: s.matric_number,
            placementType: s.placement_type,
            placementStartDate: s.placement_start_date,
            placementEndDate: s.placement_end_date,
            assignedBranchId: s.assigned_branch_id,
            supervisingCounselId: s.supervising_counsel_id,
            emergencyContactName: s.emergency_contact_name,
            emergencyContactPhone: s.emergency_contact_phone,
            completionLetterIssued: Boolean(s.completion_letter_issued),
            certificateNumber: s.certificate_number,
            createdAt: s.created_at
          })),
          documents: (documents.results || []).map(d => ({
            ...d,
            documentId: d.document_id,
            branchId: d.branch_id,
            entityType: d.entity_type,
            entityId: d.entity_id,
            fileUrl: d.file_url,
            fileDataUrl: d.file_url,
            fileName: d.file_name || d.title,
            fileSize: d.file_size,
            fileType: d.file_type,
            uploadedById: d.uploaded_by_id,
            uploadedByName: d.uploaded_by_name,
            uploadDate: d.upload_date,
            isClientVisible: Boolean(d.is_client_visible),
            googleDriveLink: d.google_drive_link
          })),
          correspondence: correspondence.results || [],
          legalResearch: (legalResearch.results || []).map(lr => ({
            ...lr,
            legalIssue: lr.legal_issue,
            caseAuthorities: lr.case_authorities,
            legalNotes: lr.legal_notes,
            matterId: lr.matter_id,
            caseId: lr.case_id,
            counselId: lr.counsel_id,
            counselName: lr.counsel_name
          })),
          appointments: appointments.results || [],
          publicNotices: (publicNotices.results || []).map(pn => ({
            ...pn,
            publishDate: pn.publish_date,
            expiryDate: pn.expiry_date,
            publishedById: pn.published_by_id,
            publishedByName: pn.published_by_name
          })),
          publicEnquiries: publicEnquiries.results || [],
          approvals: (approvals.results || []).map(a => ({
            id: a.id,
            requestType: a.request_type,
            requesterId: a.requester_id,
            requesterName: a.requester_name,
            requesterRole: a.requester_role,
            branchId: a.branch_id,
            title: a.title,
            description: a.description,
            urgency: a.urgency,
            referenceCode: a.reference_code,
            status: a.status,
            submittedAt: a.submitted_at,
            forwardedAt: a.forwarded_at,
            forwardedById: a.forwarded_by_id,
            forwardedByName: a.forwarded_by_name,
            forwardReason: a.forward_reason,
            decidedAt: a.decided_at,
            decidedById: a.decided_by_id,
            decidedByName: a.decided_by_name,
            decisionNotes: a.decision_notes
          })),
          websiteContent: websiteContent ? {
            tagline: websiteContent.tagline,
            heroHeadline: websiteContent.hero_headline,
            heroSubheadline: websiteContent.hero_subheadline,
            aboutStory: websiteContent.about_story,
            aboutFoundingYear: websiteContent.about_founding_year,
            officeHoursText: websiteContent.office_hours_text,
            emergencyHotline: websiteContent.emergency_hotline,
            consultationFeeStandard: websiteContent.consultation_fee_standard,
            internshipPolicyNotice: websiteContent.internship_policy_notice,
            recoveryOfPremisesNotice: websiteContent.recovery_of_premises_notice,
            invoiceBankName: websiteContent.invoice_bank_name,
            invoiceAccountName: websiteContent.invoice_account_name,
            invoiceAccountNumber: websiteContent.invoice_account_number,
            invoicePaymentMethod: websiteContent.invoice_payment_method,
            lastUpdated: websiteContent.last_updated,
            updatedBy: websiteContent.updated_by
          } : null,
          auditLogs: (auditLogs.results || []).map(al => ({
            id: al.id,
            timestamp: al.timestamp,
            userId: al.user_id,
            userName: al.user_name,
            userRole: al.user_role,
            action: al.action,
            entity: al.entity,
            entityId: al.entity_id,
            details: al.details
          }))
        }
      });
    }

    // --------------------------------------------------------------------------
    // 3.1 BRANCHES ENDPOINTS
    // --------------------------------------------------------------------------
    if (path === '/api/branches') {
      if (request.method === 'GET') {
        const rows = await db.prepare('SELECT * FROM branches WHERE is_active = 1').all<any>();
        return jsonResponse({ success: true, branches: rows.results || [] });
      }

      if (request.method === 'POST') {
        const auth = await getAuthUser(request, db);
        if (!auth) {
          return errorResponse('Unauthorized: Valid personnel login required.', 401);
        }
        if (auth.user.role !== 'PRINCIPAL_PARTNER') {
          return errorResponse('Unauthorized: Only Principal Partner can create branches.', 403);
        }
        const body = await request.json() as any;
        const id = body.id || `br-${Date.now()}`;
        const name = body.name?.trim();
        const code = body.code?.trim().toUpperCase();

        if (!name || !code) {
          return errorResponse('Branch name and code are required.', 400);
        }

        await db.prepare(
          `INSERT INTO branches (id, name, code, address, city, state, phone, email, head_of_chamber_id, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id, name, code, body.address || '', body.city || '', body.state || '',
          body.phone || '', body.email || '', body.headOfChamberId || null, body.isActive === false ? 0 : 1
        ).run();

        await logAudit(db, auth.user.id, auth.user.name, auth.user.role, 'CREATE_BRANCH', 'Branch', id, `Established branch: ${name} (${code})`);
        return jsonResponse({ success: true, branch: { ...body, id, name, code } }, 201);
      }
    }

    if (path.startsWith('/api/branches/') && request.method === 'PUT') {
      const auth = await getAuthUser(request, db);
      if (!auth) {
        return errorResponse('Unauthorized: Valid personnel login required.', 401);
      }
      if (auth.user.role !== 'PRINCIPAL_PARTNER') {
        return errorResponse('Unauthorized: Only Principal Partner can update branches.', 403);
      }
      const branchId = path.replace('/api/branches/', '').trim();
      const body = await request.json() as any;

      await db.prepare(
        `UPDATE branches
         SET name = ?, code = ?, address = ?, city = ?, state = ?, phone = ?, email = ?, is_active = ?
         WHERE id = ?`
      ).bind(
        body.name || '', String(body.code || '').toUpperCase(), body.address || '',
        body.city || '', body.state || '', body.phone || '', body.email || '',
        body.isActive === false ? 0 : 1, branchId
      ).run();

      await logAudit(db, auth.user.id, auth.user.name, auth.user.role, 'UPDATE_BRANCH', 'Branch', branchId, `Updated branch: ${body.name}`);
      return jsonResponse({ success: true });
    }

    if (path.startsWith('/api/branches/') && request.method === 'DELETE') {
      const auth = await getAuthUser(request, db);
      if (!auth) {
        return errorResponse('Unauthorized: Valid personnel login required.', 401);
      }
      if (auth.user.role !== 'PRINCIPAL_PARTNER' && auth.user.role !== 'HEAD_OF_CHAMBER' && auth.user.role !== 'ADMINISTRATOR_SECRETARY') {
        return errorResponse('Unauthorized: Only authorized leadership can delete branches.', 403);
      }
      const branchId = path.replace('/api/branches/', '').trim();
      if (!branchId) return errorResponse('Branch ID is required.', 400);

      if (branchId === 'br-abuja-01') {
        return errorResponse('Forbidden: Abuja Head Chambers is the permanent headquarters and cannot be deleted.', 403);
      }

      const existing = await db.prepare('SELECT id, name FROM branches WHERE id = ?').bind(branchId).first<any>();
      if (!existing) return errorResponse('Branch not found.', 404);

      // Reassign any dependent records to permanent Abuja HQ to maintain referential integrity
      await db.prepare('UPDATE users SET branch_id = "br-abuja-01" WHERE branch_id = ?').bind(branchId).run().catch(() => {});
      await db.prepare('UPDATE matters SET branch_id = "br-abuja-01" WHERE branch_id = ?').bind(branchId).run().catch(() => {});
      await db.prepare('UPDATE cases SET branch_id = "br-abuja-01" WHERE branch_id = ?').bind(branchId).run().catch(() => {});
      await db.prepare('UPDATE court_diary SET branch_id = "br-abuja-01" WHERE branch_id = ?').bind(branchId).run().catch(() => {});
      await db.prepare('UPDATE properties SET branch_id = "br-abuja-01" WHERE branch_id = ?').bind(branchId).run().catch(() => {});
      await db.prepare('UPDATE consultations SET branch_id = "br-abuja-01" WHERE branch_id = ?').bind(branchId).run().catch(() => {});
      await db.prepare('UPDATE students SET assigned_branch_id = "br-abuja-01" WHERE assigned_branch_id = ?').bind(branchId).run().catch(() => {});
      await db.prepare('UPDATE documents SET branch_id = "br-abuja-01" WHERE branch_id = ?').bind(branchId).run().catch(() => {});

      await db.prepare('DELETE FROM branches WHERE id = ?').bind(branchId).run();
      await logAudit(db, auth.user.id, auth.user.name, auth.user.role, 'DELETE_BRANCH', 'Branch', branchId, `Permanently deleted branch: ${existing.name}`);
      return jsonResponse({ success: true, message: `Branch ${existing.name} permanently deleted.` });
    }

    // --------------------------------------------------------------------------
    // 4. USER ACCOUNT ENDPOINTS
    // --------------------------------------------------------------------------
    if (path === '/api/users' && request.method === 'POST') {
      const auth = await getAuthUser(request, db);

      if (!auth) {
        return errorResponse('Unauthorized: Valid personnel login required.', 401);
      }

      if (
        auth.user.role !== 'PRINCIPAL_PARTNER' &&
        auth.user.role !== 'HEAD_OF_CHAMBER'
      ) {
        return errorResponse(
          'Unauthorized: Only Principal Partner or Head of Chamber can create user accounts.',
          403
        );
      }

      const body = await request.json() as any;

      if (!body.id || !body.username || !body.name || !body.email || !body.role) {
        return errorResponse('Required user information is missing.', 400);
      }

      const existing = await db.prepare(
        'SELECT id FROM users WHERE LOWER(username) = ? OR LOWER(email) = ? LIMIT 1'
      ).bind(
        String(body.username).trim().toLowerCase(),
        String(body.email).trim().toLowerCase()
      ).first<any>();

      if (existing) {
        return errorResponse('Username or email already exists.', 409);
      }

      await db.prepare(
        `INSERT INTO users
        (
          id, username, name, email, phone, role, branch_id, title,
          practice_areas, bio, photo_url, availability,
          is_publicly_visible, is_active, account_status,
          password_hash, salt, requires_password_change,
          failed_login_attempts, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        body.id,
        String(body.username).trim().toLowerCase(),
        body.name,
        String(body.email).trim().toLowerCase(),
        body.phone || '',
        body.role,
        body.branchId || 'br-abuja-01',
        body.title || 'Chambers Legal Practitioner',
        JSON.stringify(body.practiceAreas || []),
        body.bio || '',
        body.photoUrl || '',
        body.availability || 'AVAILABLE',
        body.isPubliclyVisible === false ? 0 : 1,
        body.isActive === false ? 0 : 1,
        body.accountStatus || 'Active',
        body.passwordHash || '',
        body.salt || '',
        body.requiresPasswordChange === false ? 0 : 1,
        body.failedLoginAttempts || 0,
        body.createdAt || new Date().toISOString()
      ).run();

      await logAudit(
        db,
        auth.user.id,
        auth.user.name,
        auth.user.role,
        'CREATE_USER',
        'User',
        body.id,
        `Created user account: ${body.name} (${body.role})`
      );

      return jsonResponse({
        success: true,
        user: {
          ...body,
          username: String(body.username).trim().toLowerCase(),
          email: String(body.email).trim().toLowerCase()
        }
      }, 201);
    }

    if (path.startsWith('/api/users/') && request.method === 'PUT') {
      const auth = await getAuthUser(request, db);

      if (!auth) {
        return errorResponse('Unauthorized: Valid personnel login required.', 401);
      }

      if (
        auth.user.role !== 'PRINCIPAL_PARTNER' &&
        auth.user.role !== 'HEAD_OF_CHAMBER'
      ) {
        return errorResponse(
          'Unauthorized: Only Principal Partner or Head of Chamber can update user accounts.',
          403
        );
      }

      const id = path.replace('/api/users/', '').trim();

      if (!id) {
        return errorResponse('User ID is required.', 400);
      }

      const body = await request.json() as any;

      const existing = await db.prepare(
        'SELECT id FROM users WHERE id = ?'
      ).bind(id).first<any>();

      if (!existing) {
        return errorResponse('User not found.', 404);
      }

      await db.prepare(
        `UPDATE users
         SET username = ?,
             name = ?,
             email = ?,
             phone = ?,
             role = ?,
             branch_id = ?,
             title = ?,
             practice_areas = ?,
             bio = ?,
             photo_url = ?,
             availability = ?,
             is_publicly_visible = ?,
             is_active = ?,
             account_status = ?,
             requires_password_change = ?
         WHERE id = ?`
      ).bind(
        String(body.username || '').trim().toLowerCase(),
        body.name || '',
        String(body.email || '').trim().toLowerCase(),
        body.phone || '',
        body.role,
        body.branchId || 'br-abuja-01',
        body.title || '',
        JSON.stringify(body.practiceAreas || []),
        body.bio || '',
        body.photoUrl !== undefined ? body.photoUrl : (body.photo_url || ''),
        body.availability || 'AVAILABLE',
        body.isPubliclyVisible === false ? 0 : 1,
        body.isActive !== undefined ? (body.isActive ? 1 : 0) : ((body.accountStatus || body.account_status) === 'Active' ? 1 : 0),
        body.accountStatus || body.account_status || 'Active',
        body.requiresPasswordChange === false ? 0 : 1,
        id
      ).run();

      await logAudit(
        db,
        auth.user.id,
        auth.user.name,
        auth.user.role,
        'UPDATE_USER',
        'User',
        id,
        `Updated user account: ${body.name || id}`
      );

      return jsonResponse({ success: true });
    }

    if (path.startsWith('/api/users/') && path.endsWith('/status') && (request.method === 'PATCH' || request.method === 'PUT')) {
      const auth = await getAuthUser(request, db);

      if (!auth) {
        return errorResponse('Unauthorized: Valid personnel login required.', 401);
      }

      if (
        auth.user.role !== 'PRINCIPAL_PARTNER' &&
        auth.user.role !== 'HEAD_OF_CHAMBER'
      ) {
        return errorResponse(
          'Unauthorized: Only Principal Partner or Head of Chamber can alter account status.',
          403
        );
      }

      const id = path.replace('/api/users/', '').replace('/status', '').trim();
      const body = await request.json() as any;
      const targetStatus = body.status || body.accountStatus;

      if (!targetStatus) {
        return errorResponse('Account status is required (e.g. Active, Suspended).', 400);
      }

      const existing = await db.prepare(
        'SELECT id, username, name, role FROM users WHERE id = ?'
      ).bind(id).first<any>();

      if (!existing) {
        return errorResponse('User not found.', 404);
      }

      if (existing.role === 'PRINCIPAL_PARTNER' && targetStatus !== 'Active') {
        return errorResponse('Forbidden: The Principal Partner account cannot be suspended or deactivated.', 403);
      }

      if (auth.user.role === 'HEAD_OF_CHAMBER' && existing.role === 'PRINCIPAL_PARTNER') {
        return errorResponse('Forbidden: Head of Chamber cannot modify Principal Partner account status.', 403);
      }

      const isActive = targetStatus === 'Active' ? 1 : 0;

      await db.prepare(
        'UPDATE users SET account_status = ?, is_active = ? WHERE id = ?'
      ).bind(targetStatus, isActive, id).run();

      await logAudit(
        db,
        auth.user.id,
        auth.user.name,
        auth.user.role,
        'UPDATE_USER_STATUS',
        'User',
        id,
        `Updated user account status for ${existing.name} to "${targetStatus}"`
      );

      return jsonResponse({ success: true, status: targetStatus, isActive: Boolean(isActive) });
    }

    if (path.startsWith('/api/users/') && request.method === 'DELETE') {
      const auth = await getAuthUser(request, db);

      if (!auth) {
        return errorResponse('Unauthorized: Valid personnel login required.', 401);
      }

      if (
        auth.user.role !== 'PRINCIPAL_PARTNER' &&
        auth.user.role !== 'HEAD_OF_CHAMBER'
      ) {
        return errorResponse(
          'Unauthorized: Only Principal Partner or Head of Chamber can permanently delete user accounts.',
          403
        );
      }

      const id = path.replace('/api/users/', '').trim();

      if (!id) {
        return errorResponse('User ID is required.', 400);
      }

      const existing = await db.prepare(
        'SELECT id, username, name, role FROM users WHERE id = ?'
      ).bind(id).first<any>();

      if (!existing) {
        return errorResponse('User not found.', 404);
      }

      if (existing.role === 'PRINCIPAL_PARTNER') {
        return errorResponse(
          'Forbidden: The Principal Partner account is permanently protected and cannot be deleted.',
          403
        );
      }

      if (existing.id === auth.user.id) {
        return errorResponse(
          'Forbidden: You cannot delete your own active session account.',
          400
        );
      }

      if (auth.user.role === 'HEAD_OF_CHAMBER' && (existing.role === 'PRINCIPAL_PARTNER' || existing.role === 'HEAD_OF_CHAMBER')) {
        return errorResponse(
          'Forbidden: Head of Chamber cannot delete Partner-level accounts.',
          403
        );
      }

      // Clean up sessions
      await db.prepare('DELETE FROM user_sessions WHERE user_id = ?').bind(id).run().catch(() => {});

      // Delete user completely
      await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();

      await logAudit(
        db,
        auth.user.id,
        auth.user.name,
        auth.user.role,
        'DELETE_USER',
        'User',
        id,
        `Permanently deleted user account: ${existing.name} (@${existing.username})`
      );

      return jsonResponse({
        success: true,
        message: `User account ${existing.name} has been permanently deleted from Chambers database.`
      });
    }

    // --------------------------------------------------------------------------
    // 5. CLIENTS ENDPOINTS
    // --------------------------------------------------------------------------
    if (path === '/api/clients') {
      if (request.method === 'GET') {
        // SECURITY FIX: Require authentication to read client data
        const auth = await getAuthUser(request, db);
        if (!auth) {
          return errorResponse('Unauthorized: Valid personnel login required.', 401);
        }
        const bf = branchFilterClause(auth.user);
        const rows = bf.clause
          ? await db.prepare(`SELECT * FROM clients ${bf.clause} ORDER BY date_registered DESC`).bind(...bf.params).all<any>()
          : await db.prepare('SELECT * FROM clients ORDER BY date_registered DESC').all<any>();
        return jsonResponse({ success: true, clients: rows.results || [] });
      }

      if (request.method === 'POST') {
        // SECURITY FIX: Require authentication to create clients
        const auth = await getAuthUser(request, db);
        if (!auth) {
          return errorResponse('Unauthorized: Valid personnel login required.', 401);
        }
        const body = await request.json() as any;
        const clientId = body.clientId || await getNextNumber(db, 'client', 'CLI');
        const id = body.id || `cli-${Date.now()}`;
        const dateRegistered = body.dateRegistered || new Date().toISOString();

        await db.prepare(
          `INSERT INTO clients 
           (id, client_id, full_name, organization, client_type, phone, email, address, state, lga, branch_id, assigned_lawyer_id, conflict_check_status, conflict_check_notes, conflict_reviewed_by, date_registered, is_active, confidential_notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
        ).bind(
          id, clientId, body.fullName, body.organization || null, body.clientType || 'Individual',
          body.phone, body.email, body.address || '', body.state || 'FCT', body.lga || 'AMAC',
          body.branchId || 'br-abuja-01', body.assignedLawyerId || null, body.conflictCheckStatus || 'Passed',
          body.conflictCheckNotes || '', body.conflictReviewedBy || null, dateRegistered, body.confidentialNotes || ''
        ).run();

        await logAudit(db, auth.user.id, auth.user.name, auth.user.role, 'REGISTER_CLIENT', 'Client', id, `Registered client: ${body.fullName} (${clientId})`);

        const createdClient: Client = {
          id,
          clientId,
          fullName: body.fullName,
          organization: body.organization,
          clientType: body.clientType || 'Individual',
          phone: body.phone,
          email: body.email,
          address: body.address || '',
          state: body.state || 'FCT',
          lga: body.lga || 'AMAC',
          identificationType: body.identificationType,
          identificationNumber: body.identificationNumber,
          branchId: body.branchId || 'br-abuja-01',
          assignedLawyerId: body.assignedLawyerId,
          conflictCheckStatus: body.conflictCheckStatus || 'Passed',
          conflictCheckNotes: body.conflictCheckNotes,
          dateRegistered,
          isActive: true,
          confidentialNotes: body.confidentialNotes
        };

        return jsonResponse({ success: true, client: createdClient });
      }
    }

    if (path.startsWith('/api/clients/') && request.method === 'PUT') {
      // SECURITY FIX: Require authentication to update clients
      const auth = await getAuthUser(request, db);
      if (!auth) {
        return errorResponse('Unauthorized: Valid personnel login required.', 401);
      }
      const id = path.replace('/api/clients/', '').trim();
      const body = await request.json() as any;

      await db.prepare(
        `UPDATE clients 
         SET full_name = ?, organization = ?, client_type = ?, phone = ?, email = ?, 
             address = ?, state = ?, lga = ?, assigned_lawyer_id = ?, conflict_check_status = ?, 
             conflict_check_notes = ?, confidential_notes = ?, is_active = ?
         WHERE id = ?`
      ).bind(
        body.fullName, body.organization || null, body.clientType || 'Individual', body.phone, body.email,
        body.address, body.state, body.lga, body.assignedLawyerId || null, body.conflictCheckStatus || 'Passed',
        body.conflictCheckNotes || '', body.confidentialNotes || '', body.isActive ? 1 : 0, id
      ).run();

      await logAudit(db, auth.user.id, auth.user.name, auth.user.role, 'UPDATE_CLIENT', 'Client', id, `Updated client ${body.fullName}`);
      return jsonResponse({ success: true });
    }

    // --------------------------------------------------------------------------
    // 5. INVOICES & PAYMENTS (CRITICAL ROLE-ENFORCED)
    // --------------------------------------------------------------------------
    if (path === '/api/invoices') {
      if (request.method === 'GET') {
        // SECURITY FIX: Require authentication to read invoices
        const auth = await getAuthUser(request, db);
        if (!auth) {
          return errorResponse('Unauthorized: Valid personnel login required.', 401);
        }
        const bf = branchFilterClause(auth.user);
        const rows = bf.clause
          ? await db.prepare(`SELECT * FROM invoices ${bf.clause} ORDER BY created_at DESC`).bind(...bf.params).all<any>()
          : await db.prepare('SELECT * FROM invoices ORDER BY created_at DESC').all<any>();
        return jsonResponse({ success: true, invoices: rows.results || [] });
      }

      if (request.method === 'POST') {
        // SECURITY FIX: Require billing-role authentication to create invoices
        const auth = await getAuthUser(request, db);
        if (!auth) {
          return errorResponse('Unauthorized: Valid personnel login required.', 401);
        }
        if (!canManageBilling(auth.user)) {
          return errorResponse('Unauthorized: Only billing-authorized personnel can create invoices.', 403);
        }
        const body = await request.json() as any;
        const invoiceNumber = body.invoiceNumber || await getNextNumber(db, 'invoice', 'INV');
        const paymentReference = body.paymentReference || await getNextNumber(db, 'payment', 'PAY');
        const id = body.id || `inv-${Date.now()}`;

        // A newly created invoice always starts UNPAID — it can never be created
        // already verified.
        const initialStatus = (body.paymentStatus && body.paymentStatus !== PAYMENT_STATUS_VERIFIED)
          ? body.paymentStatus
          : INVOICE_STATUS_UNPAID;

        await db.prepare(
          `INSERT INTO invoices 
           (id, invoice_number, client_id, client_name, client_email, client_phone, matter_id, branch_id, consultation_id, consultation_code, purpose, service_type, service_ref, property_id, landlord_id, items, subtotal, tax_amount, total_amount, date, due_date, payment_status, approval_status, payment_reference, payment_method, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id, invoiceNumber, body.clientId || null, body.clientName, body.clientEmail, body.clientPhone,
          body.matterId || null, body.branchId || 'br-abuja-01', body.consultationId || null, body.consultationCode || null,
          body.purpose || 'GENERAL_BILLING', body.serviceType || 'GENERAL', body.serviceRef || null,
          body.propertyId || null, body.landlordId || null,
          JSON.stringify(body.items || []), body.subtotal || body.totalAmount, body.taxAmount || 0,
          body.totalAmount, body.date || new Date().toISOString().split('T')[0], body.dueDate,
          initialStatus, body.approvalStatus || 'NONE', paymentReference, body.paymentMethod || null, body.notes || ''
        ).run();

        await logAudit(db, auth.user.id, auth.user.name, auth.user.role, 'CREATE_INVOICE', 'Invoice', id, `Generated invoice ${invoiceNumber} for ${body.clientName} (₦${Number(body.totalAmount).toLocaleString()})`);

        return jsonResponse({ success: true, invoiceNumber, paymentReference, id });
      }
    }

    if (path.startsWith('/api/invoices/') && request.method === 'PUT') {
      const id = path.replace('/api/invoices/', '').trim();
      const body = await request.json() as any;
      const auth = await getAuthUser(request, db);

      // SECURITY FIX: Require authentication and billing role
      if (!auth) {
        return errorResponse('Unauthorized: Valid personnel login required.', 401);
      }
      if (!canManageBilling(auth.user)) {
        return errorResponse('Unauthorized: Only billing-authorized personnel can modify invoices.', 403);
      }

      const existing = await db.prepare('SELECT * FROM invoices WHERE id = ?').bind(id).first<any>();
      if (!existing) {
        return errorResponse('Invoice not found.', 404);
      }

      const requestedStatus = typeof body.paymentStatus === 'string' ? body.paymentStatus : undefined;

      // Ordinary invoice editing must never bypass the payment approval process.
      if (requestedStatus === PAYMENT_STATUS_VERIFIED && existing.payment_status !== PAYMENT_STATUS_VERIFIED) {
        return errorResponse('An invoice can only be marked PAID through the authorized payment verification process.', 403);
      }
      if (requestedStatus === PAYMENT_STATUS_SUBMITTED && existing.payment_status !== PAYMENT_STATUS_SUBMITTED) {
        return errorResponse('Invoice payment submission status cannot be altered through ordinary editing.', 400);
      }
      if (existing.payment_status === PAYMENT_STATUS_SUBMITTED && body.totalAmount !== undefined && Number(body.totalAmount) !== Number(existing.total_amount)) {
        return errorResponse('The total of an invoice awaiting payment verification cannot be changed.', 409);
      }
      if (existing.payment_status === PAYMENT_STATUS_VERIFIED) {
        if (requestedStatus && requestedStatus !== PAYMENT_STATUS_VERIFIED) {
          return errorResponse('A verified invoice cannot be reopened by ordinary editing. An authorized adjustment is required.', 409);
        }
        if (body.totalAmount !== undefined && Number(body.totalAmount) !== Number(existing.total_amount)) {
          return errorResponse('The total of a verified invoice cannot be changed without an authorized adjustment.', 409);
        }
      }

      // Invoice number and payment reference are immutable here.
      await db.prepare(
        `UPDATE invoices 
         SET client_name = ?, client_email = ?, client_phone = ?, subtotal = ?, total_amount = ?, 
             payment_status = ?, approval_status = ?, notes = ?
         WHERE id = ?`
      ).bind(
        body.clientName ?? existing.client_name,
        body.clientEmail ?? existing.client_email,
        body.clientPhone ?? existing.client_phone,
        body.subtotal ?? existing.subtotal,
        body.totalAmount ?? existing.total_amount,
        requestedStatus || existing.payment_status,
        body.approvalStatus || existing.approval_status || 'NONE',
        body.notes ?? existing.notes ?? '', id
      ).run();

      await logAudit(db, auth.user.id, auth.user.name, auth.user.role, 'UPDATE_INVOICE', 'Invoice', id, `Updated invoice ${existing.invoice_number} for ${body.clientName || existing.client_name}`);
      return jsonResponse({ success: true });
    }

    if (path === '/api/payments') {
      if (request.method === 'GET') {
        // SECURITY FIX: Require authentication to read payments
        const auth = await getAuthUser(request, db);
        if (!auth) {
          return errorResponse('Unauthorized: Valid personnel login required.', 401);
        }
        const bf = branchFilterClause(auth.user);
        const rows = bf.clause
          ? await db.prepare(`SELECT * FROM payments ${bf.clause} ORDER BY submitted_at DESC`).bind(...bf.params).all<any>()
          : await db.prepare('SELECT * FROM payments ORDER BY submitted_at DESC').all<any>();
        return jsonResponse({ success: true, payments: rows.results || [] });
      }

      // Submit payment — public endpoint (clients submit payment proof).
      // SECURITY: the submitted proof is recorded as AWAITING VERIFICATION only.
      // It never marks an invoice paid, never activates a service, and never
      // writes any verified/receipt field. Amount, branch and service links are
      // taken from the stored invoice — never trusted from the browser.
      if (request.method === 'POST') {
        let body: any;
        try {
          body = await request.json();
        } catch {
          return errorResponse('Malformed payment submission payload.', 400);
        }

        const invoiceNumber = typeof body.invoiceNumber === 'string' ? body.invoiceNumber.trim() : '';
        const paymentReference = typeof body.paymentReference === 'string' ? body.paymentReference.trim() : '';
        if (!invoiceNumber && !paymentReference) {
          return errorResponse('An invoice number or payment reference is required.', 400);
        }

        // Resolve the invoice authoritatively.
        const invoice = await db.prepare(
          'SELECT * FROM invoices WHERE invoice_number = ? OR payment_reference = ? LIMIT 1'
        ).bind(invoiceNumber || paymentReference, invoiceNumber || paymentReference).first<any>();
        if (!invoice) {
          return errorResponse('No matching invoice was found for the supplied reference.', 404);
        }

        // A settled invoice cannot be paid again.
        if (invoice.payment_status === PAYMENT_STATUS_VERIFIED) {
          return errorResponse('This invoice has already been settled and verified.', 409);
        }
        if (invoice.payment_status === 'CANCELLED') {
          return errorResponse('This invoice has been cancelled and cannot accept payment.', 409);
        }

        // Amount must match the stored invoice — the browser value is not trusted.
        const amountDue = Number(invoice.total_amount);
        if (body.amount !== undefined && body.amount !== null && Number(body.amount) !== amountDue) {
          return errorResponse(`Payment amount does not match the invoice total of ₦${amountDue.toLocaleString()}.`, 400);
        }

        // Validate the proof document (URL or data-URL) if supplied.
        const proofDocumentUrl = typeof body.proofDocumentUrl === 'string' ? body.proofDocumentUrl : null;
        if (proofDocumentUrl && proofDocumentUrl.length > MAX_PROOF_LENGTH) {
          return errorResponse('The uploaded payment proof is too large. Please upload a smaller file.', 413);
        }

        // Prevent a duplicate active submission for the same invoice (safe retries).
        const existing = await db.prepare(
          `SELECT id FROM payments WHERE invoice_number = ? AND status = ? ORDER BY submitted_at DESC LIMIT 1`
        ).bind(invoice.invoice_number, PAYMENT_STATUS_SUBMITTED).first<any>();
        if (existing) {
          return jsonResponse({ success: true, paymentId: existing.id, status: PAYMENT_STATUS_SUBMITTED, duplicate: true });
        }

        // Unique reference per submission attempt (the invoice reference is
        // reused for a legitimate resubmission after a rejection).
        let attemptReference = invoice.payment_reference;
        const taken = await db.prepare('SELECT id FROM payments WHERE payment_reference = ? LIMIT 1').bind(attemptReference).first<any>();
        if (taken) {
          const priorCount = await db.prepare('SELECT COUNT(*) as c FROM payments WHERE invoice_number = ?').bind(invoice.invoice_number).first<{ c: number }>();
          attemptReference = `${invoice.payment_reference}-R${(priorCount?.c || 1) + 1}`;
        }

        const id = `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const submittedAt = new Date().toISOString();
        const serviceType: PaymentServiceType = (invoice.service_type as PaymentServiceType) || 'GENERAL';
        const serviceRef: string | null = invoice.service_ref || null;

        await db.prepare(
          `INSERT INTO payments 
           (id, payment_reference, invoice_number, invoice_id, service_type, service_ref, client_name, amount, branch_id, payment_method, payment_date, status, bank_transaction_ref, proof_document_url, submitted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id, attemptReference, invoice.invoice_number, invoice.id, serviceType, serviceRef,
          invoice.client_name, amountDue, invoice.branch_id || 'br-abuja-01',
          body.paymentMethod || 'Bank Transfer',
          body.paymentDate || submittedAt.split('T')[0], PAYMENT_STATUS_SUBMITTED,
          typeof body.bankTransactionRef === 'string' ? body.bankTransactionRef.trim() : null,
          proofDocumentUrl, submittedAt
        ).run();

        // Mark the invoice as awaiting verification ONLY (never paid/verified).
        await db.prepare(
          `UPDATE invoices SET payment_status = ? WHERE id = ? AND payment_status NOT IN (?, 'CANCELLED')`
        ).bind(PAYMENT_STATUS_SUBMITTED, invoice.id, PAYMENT_STATUS_VERIFIED).run();

        // Reflect the pending state on the explicitly linked service.
        if (serviceType === 'CONSULTATION') {
          const whereService = serviceRef ? 'id = ?' : 'invoice_number = ?';
          const whereValue = serviceRef || invoice.invoice_number;
          await db.prepare(
            `UPDATE consultations SET status = 'Payment Verification Pending',
                client_visible_update = 'Payment submitted. Awaiting verification by the Account Officer.'
             WHERE ${whereService}`
          ).bind(whereValue).run();
        }

        await logAudit(
          db, 'public', invoice.client_name, 'PUBLIC', 'SUBMIT_PAYMENT', 'Payment', id,
          `Payment proof submitted for invoice ${invoice.invoice_number} (₦${amountDue.toLocaleString()}) — awaiting verification`
        );

        return jsonResponse({ success: true, paymentId: id, status: PAYMENT_STATUS_SUBMITTED });
      }
    }

    // Authorized payment verification — the ONLY path that may settle an
    // invoice, issue a durable receipt, or activate a paid service.
    if (path === '/api/payments/verify' && request.method === 'PUT') {
      const auth = await getAuthUser(request, db);
      if (!auth) return errorResponse('Unauthorized: Valid personnel login required.', 401);

      // Single shared permission policy (see src/server/auth.ts).
      if (!canVerifyPayments(auth.user)) {
        return errorResponse(
          `Forbidden: Only an authorized payment verifier may verify payments. Permitted roles: ${PAYMENT_VERIFIER_ROLES.join(', ')}.`,
          403
        );
      }

      let body: any;
      try {
        body = await request.json();
      } catch {
        return errorResponse('Malformed verification payload.', 400);
      }

      const paymentId = typeof body.paymentId === 'string' ? body.paymentId.trim() : '';
      if (!paymentId) return errorResponse('Payment ID is required.', 400);

      const isApproved = body.isApproved === true;
      const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 2000) : '';
      if (!isApproved && !notes) {
        return errorResponse('A rejection reason is required.', 400);
      }

      // The payment must exist. Actor identity is taken from the session only.
      const payment = await db.prepare('SELECT * FROM payments WHERE id = ?').bind(paymentId).first<any>();
      if (!payment) return errorResponse('Payment submission not found.', 404);

      // Branch-level restriction on payment records.
      if (auth.user.role !== 'PRINCIPAL_PARTNER' && payment.branch_id && payment.branch_id !== auth.user.branchId) {
        return errorResponse('Forbidden: This payment belongs to another branch.', 403);
      }

      // Already verified → idempotent: never issue a second receipt.
      if (payment.status === PAYMENT_STATUS_VERIFIED) {
        return jsonResponse({
          success: true,
          alreadyVerified: true,
          receiptNumber: payment.receipt_number || null,
          status: PAYMENT_STATUS_VERIFIED
        });
      }

      // Only a submission awaiting verification may be decided, unless a defined
      // administrative correction (Principal Partner only) explicitly permits it.
      const correctionAllowed = canApplyPaymentCorrection(auth.user) && body.administrativeCorrection === true;
      if (payment.status !== PAYMENT_STATUS_SUBMITTED && !correctionAllowed) {
        return errorResponse('This payment is not awaiting verification and cannot be changed without an authorized administrative correction.', 409);
      }

      const invoice = payment.invoice_id
        ? await db.prepare('SELECT * FROM invoices WHERE id = ?').bind(payment.invoice_id).first<any>()
        : await db.prepare('SELECT * FROM invoices WHERE invoice_number = ?').bind(payment.invoice_number).first<any>();

      if (isApproved) {
        const receiptNumber = await getNextNumber(db, 'receipt', 'REC');

        // Guard the state transition atomically: only a payment that is not yet
        // verified can be moved to verified.
        const upd = await db.prepare(
          `UPDATE payments 
           SET status = ?, receipt_number = ?, verified_by_id = ?, verified_by_name = ?, 
               verification_date = datetime('now'), verification_notes = ?
           WHERE id = ? AND status <> ?`
        ).bind(PAYMENT_STATUS_VERIFIED, receiptNumber, auth.user.id, auth.user.name, notes, paymentId, PAYMENT_STATUS_VERIFIED).run();

        if (!upd?.meta?.changes) {
          const fresh = await db.prepare('SELECT receipt_number FROM payments WHERE id = ?').bind(paymentId).first<any>();
          return jsonResponse({ success: true, alreadyVerified: true, receiptNumber: fresh?.receipt_number || null, status: PAYMENT_STATUS_VERIFIED });
        }

        // Persist the durable receipt exactly once per payment submission.
        const existingReceipt = await db.prepare('SELECT receipt_number FROM receipts WHERE payment_reference = ?').bind(payment.payment_reference).first<any>();
        const finalReceiptNumber = existingReceipt?.receipt_number || receiptNumber;
        if (finalReceiptNumber !== receiptNumber) {
          await db.prepare('UPDATE payments SET receipt_number = ? WHERE id = ?').bind(finalReceiptNumber, paymentId).run();
        }
        if (!existingReceipt) {
          await db.prepare(
            `INSERT OR IGNORE INTO receipts
             (id, receipt_number, payment_reference, invoice_number, client_name, amount, payment_method, issued_date, issued_by_id, issued_by_name)
             VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)`
          ).bind(
            `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            finalReceiptNumber, payment.payment_reference, payment.invoice_number,
            payment.client_name, Number(payment.amount), payment.payment_method || 'Bank Transfer',
            auth.user.id, auth.user.name
          ).run();
        }

        // Settle the invoice (guard: never overwrite a CANCELLED invoice).
        await db.prepare(
          `UPDATE invoices SET payment_status = ? WHERE invoice_number = ? AND payment_status <> 'CANCELLED'`
        ).bind(PAYMENT_STATUS_VERIFIED, payment.invoice_number).run();

        // Activate ONLY the explicitly linked service.
        const serviceType = payment.service_type || invoice?.service_type;
        const serviceRef = payment.service_ref || invoice?.service_ref || (serviceType === 'PROPERTY' ? invoice?.property_id : undefined);
        if (serviceType === 'CONSULTATION') {
          const where = serviceRef ? 'id = ?' : 'invoice_number = ?';
          await db.prepare(
            `UPDATE consultations SET status = 'Payment Verified',
                client_visible_update = ?
             WHERE ${where}`
          ).bind(`Payment verified by Accounts. Receipt ${finalReceiptNumber} issued. Your consultation schedule is confirmed.`, serviceRef || payment.invoice_number).run();
        } else if (serviceType === 'PROPERTY' && serviceRef) {
          await db.prepare(
            `UPDATE properties SET registration_payment_status = ?, legal_status = 'Managed by Chambers' WHERE id = ? OR property_id = ?`
          ).bind(PROPERTY_PAYMENT_CONFIRMED, serviceRef, serviceRef).run();
        }

        await logAudit(
          db, auth.user.id, auth.user.name, auth.user.role, 'VERIFY_PAYMENT', 'Payment', paymentId,
          `Verified payment of ₦${Number(payment.amount).toLocaleString()} for ${payment.client_name} (invoice ${payment.invoice_number}); receipt ${finalReceiptNumber} issued`
        );

        return jsonResponse({ success: true, receiptNumber: finalReceiptNumber, status: PAYMENT_STATUS_VERIFIED });
      }

      // Rejection path — record history, create NO receipt, activate NOTHING.
      const upd = await db.prepare(
        `UPDATE payments 
         SET status = ?, receipt_number = NULL, verified_by_id = ?, verified_by_name = ?, 
             verification_date = datetime('now'), verification_notes = ?
         WHERE id = ? AND status <> ?`
      ).bind(PAYMENT_STATUS_REJECTED, auth.user.id, auth.user.name, notes, paymentId, PAYMENT_STATUS_VERIFIED).run();
      if (!upd?.meta?.changes) {
        return errorResponse('This payment was already settled and cannot be rejected.', 409);
      }

      await db.prepare(
        `UPDATE invoices SET payment_status = ? WHERE invoice_number = ? AND payment_status <> ?`
      ).bind(INVOICE_STATUS_UNPAID, payment.invoice_number, PAYMENT_STATUS_VERIFIED).run();

      const serviceType = payment.service_type || invoice?.service_type;
      const serviceRef = payment.service_ref || invoice?.service_ref || (serviceType === 'PROPERTY' ? invoice?.property_id : undefined);
      if (serviceType === 'CONSULTATION') {
        const where = serviceRef ? 'id = ?' : 'invoice_number = ?';
        await db.prepare(
          `UPDATE consultations SET status = 'Awaiting Payment', client_visible_update = ?
           WHERE ${where}`
        ).bind(`Payment could not be verified: ${notes}. Please correct the details and resubmit.`, serviceRef || payment.invoice_number).run();
      }
      // A property registration fee that is rejected simply stays PENDING_PAYMENT.

      await logAudit(
        db, auth.user.id, auth.user.name, auth.user.role, 'REJECT_PAYMENT', 'Payment', paymentId,
        `Rejected payment of ₦${Number(payment.amount).toLocaleString()} for ${payment.client_name} (invoice ${payment.invoice_number}): ${notes}`
      );

      return jsonResponse({ success: true, receiptNumber: null, status: PAYMENT_STATUS_REJECTED });
    }

    if (path === '/api/receipts' && request.method === 'GET') {
      const auth = await getAuthUser(request, db);
      if (!auth) {
        return errorResponse('Unauthorized: Valid personnel login required.', 401);
      }
      const ref = url.searchParams.get('ref');
      let query = 'SELECT * FROM receipts';
      let params: any[] = [];
      if (ref) {
        query += ' WHERE receipt_number = ? OR payment_reference = ? OR invoice_number = ?';
        params = [ref, ref, ref];
      }
      query += ' ORDER BY issued_date DESC LIMIT 200';
      const rows = params.length > 0
        ? await db.prepare(query).bind(...params).all<any>()
        : await db.prepare(query).all<any>();
      return jsonResponse({
        success: true,
        receipts: (rows.results || []).map((r: any) => ({
          id: r.id,
          receiptNumber: r.receipt_number,
          paymentReference: r.payment_reference,
          invoiceNumber: r.invoice_number,
          clientName: r.client_name,
          amount: Number(r.amount),
          paymentMethod: r.payment_method,
          issuedDate: r.issued_date,
          issuedById: r.issued_by_id,
          issuedByName: r.issued_by_name,
          createdAt: r.created_at
        }))
      });
    }

    // --------------------------------------------------------------------------
    // 6. MATTERS, CASES & ASSIGNMENTS
    // --------------------------------------------------------------------------
    if (path === '/api/matters') {
      if (request.method === 'GET') {
        // SECURITY FIX: Require authentication
        const auth = await getAuthUser(request, db);
        if (!auth) {
          return errorResponse('Unauthorized: Valid personnel login required.', 401);
        }
        const bf = branchFilterClause(auth.user);
        const rows = bf.clause
          ? await db.prepare(`SELECT * FROM matters ${bf.clause} ORDER BY created_at DESC`).bind(...bf.params).all<any>()
          : await db.prepare('SELECT * FROM matters ORDER BY created_at DESC').all<any>();
        return jsonResponse({ success: true, matters: rows.results || [] });
      }

      if (request.method === 'POST') {
        // SECURITY FIX: Require authentication
        const auth = await getAuthUser(request, db);
        if (!auth) {
          return errorResponse('Unauthorized: Valid personnel login required.', 401);
        }
        const body = await request.json() as any;
        const matterId = body.matterId || await getNextNumber(db, 'matter', 'MAT');
        const id = body.id || `mat-${Date.now()}`;

        await db.prepare(
          `INSERT INTO matters 
           (id, matter_id, title, client_id, branch_id, lead_counsel_id, category, status, stage, engagement_date, client_visible_update, privileged_internal_notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id, matterId, body.title || '', body.clientId || null, body.branchId || 'br-abuja-01', body.leadCounselId || null,
          body.category || 'General Litigation', body.status || 'Active', body.stage || 'Pleadings Preparation',
          body.engagementDate || new Date().toISOString().split('T')[0], body.clientVisibleUpdate || '', body.privilegedInternalNotes || ''
        ).run();

        await logAudit(db, auth.user.id, auth.user.name, auth.user.role, 'CREATE_MATTER', 'Matter', id, `Opened matter: ${body.title} (${matterId})`);
        return jsonResponse({ success: true, matterId, id });
      }
    }

    if (path.startsWith('/api/matters/') && request.method === 'DELETE') {
      const auth = await getAuthUser(request, db);
      if (!auth) {
        return errorResponse('Unauthorized: Valid personnel login required.', 401);
      }
      if (auth.user.role !== 'PRINCIPAL_PARTNER' && auth.user.role !== 'HEAD_OF_CHAMBER' && auth.user.role !== 'ADMINISTRATOR_SECRETARY') {
        return errorResponse('Unauthorized: Only authorized personnel can delete legal matters.', 403);
      }
      const matterId = path.replace('/api/matters/', '').trim();
      if (!matterId) return errorResponse('Matter ID is required.', 400);

      const existing = await db.prepare('SELECT id, matter_id, title FROM matters WHERE id = ? OR matter_id = ?').bind(matterId, matterId).first<any>();
      if (!existing) return errorResponse('Matter not found.', 404);

      await db.prepare('DELETE FROM matters WHERE id = ?').bind(existing.id).run();
      await logAudit(db, auth.user.id, auth.user.name, auth.user.role, 'DELETE_MATTER', 'Matter', existing.id, `Permanently deleted matter: ${existing.title} (${existing.matter_id})`);
      return jsonResponse({ success: true, message: `Legal matter ${existing.title} permanently deleted.` });
    }

    if (path.startsWith('/api/matters/') && request.method === 'PUT') {
      const auth = await getAuthUser(request, db);
      if (!auth) {
        return errorResponse('Unauthorized: Valid personnel login required.', 401);
      }
      const matterId = path.replace('/api/matters/', '').trim();
      const body = await request.json() as any;

      await db.prepare(
        `UPDATE matters
         SET title = ?, category = ?, status = ?, stage = ?, lead_counsel_id = ?,
             client_visible_update = ?, privileged_internal_notes = ?
         WHERE id = ? OR matter_id = ?`
      ).bind(
        body.title || '', body.category || '', body.status || 'Active', body.stage || '',
        body.leadCounselId || null, body.clientVisibleUpdate || '', body.privilegedInternalNotes || '',
        matterId, matterId
      ).run();

      await logAudit(db, auth.user.id, auth.user.name, auth.user.role, 'UPDATE_MATTER', 'Matter', matterId, `Updated matter: ${body.title || matterId}`);
      return jsonResponse({ success: true });
    }

    if (path === '/api/cases') {
      if (request.method === 'GET') {
        // SECURITY FIX: Require authentication
        const auth = await getAuthUser(request, db);
        if (!auth) {
          return errorResponse('Unauthorized: Valid personnel login required.', 401);
        }
        const bf = branchFilterClause(auth.user);
        const rows = bf.clause
          ? await db.prepare(`SELECT * FROM cases ${bf.clause} ORDER BY created_at DESC`).bind(...bf.params).all<any>()
          : await db.prepare('SELECT * FROM cases ORDER BY created_at DESC').all<any>();
        return jsonResponse({ success: true, cases: rows.results || [] });
      }

      if (request.method === 'POST') {
        // SECURITY FIX: Require authentication
        const auth = await getAuthUser(request, db);
        if (!auth) {
          return errorResponse('Unauthorized: Valid personnel login required.', 401);
        }
        const body = await request.json() as any;
        const caseId = body.caseId || await getNextNumber(db, 'case', 'CASE');
        const id = body.id || `case-${Date.now()}`;

        await db.prepare(
          `INSERT INTO cases 
           (id, case_id, suit_number, matter_id, client_id, branch_id, court_id, judicial_division, judge, counsel_id, opposing_party, opposing_counsel, case_type, subject_matter, filing_date, next_court_date, status, client_visible_update, internal_strategy_notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id, caseId, body.suitNumber, body.matterId, body.clientId, body.branchId || 'br-abuja-01',
          body.courtId || 'crt-01', body.judicialDivision || 'Abuja', body.judge || null,
          body.counselId, body.opposingParty, body.opposingCounsel || null, body.caseType || 'Civil',
          body.subjectMatter || '', body.filingDate || new Date().toISOString().split('T')[0],
          body.nextCourtDate || null, body.status || 'Hearing', body.clientVisibleUpdate || '', body.internalStrategyNotes || ''
        ).run();

        // Create assignment record (auth already verified above)
        const asgnId = `asgn-${Date.now()}`;
        await db.prepare(
          `INSERT INTO case_assignments (id, case_id, suit_number, branch_id, counsel_id, assigned_by_id, assigned_by_name, date_assigned, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), 'PENDING')`
        ).bind(
          asgnId, id, body.suitNumber, body.branchId || 'br-abuja-01', body.counselId,
          auth.user.id, auth.user.name
        ).run();

        await logAudit(db, auth.user.id, auth.user.name, auth.user.role, 'FILE_CASE', 'Case', id, `Registered case ${body.suitNumber} (${caseId})`);
        return jsonResponse({ success: true, caseId, id });
      }
    }

    if (path.startsWith('/api/cases/') && request.method === 'DELETE') {
      const auth = await getAuthUser(request, db);
      if (!auth) {
        return errorResponse('Unauthorized: Valid personnel login required.', 401);
      }
      if (auth.user.role !== 'PRINCIPAL_PARTNER' && auth.user.role !== 'HEAD_OF_CHAMBER' && auth.user.role !== 'ADMINISTRATOR_SECRETARY') {
        return errorResponse('Unauthorized: Only authorized personnel can delete litigation cases.', 403);
      }
      const caseId = path.replace('/api/cases/', '').trim();
      if (!caseId) return errorResponse('Case ID is required.', 400);

      const existing = await db.prepare('SELECT id, case_id, suit_number FROM cases WHERE id = ? OR case_id = ?').bind(caseId, caseId).first<any>();
      if (!existing) return errorResponse('Case not found.', 404);

      await db.prepare('DELETE FROM case_assignments WHERE case_id = ?').bind(existing.id).run().catch(() => {});
      await db.prepare('DELETE FROM cases WHERE id = ?').bind(existing.id).run();
      await logAudit(db, auth.user.id, auth.user.name, auth.user.role, 'DELETE_CASE', 'Case', existing.id, `Permanently deleted case: ${existing.suit_number} (${existing.case_id})`);
      return jsonResponse({ success: true, message: `Litigation case ${existing.suit_number} permanently deleted.` });
    }

    if (path.startsWith('/api/cases/') && request.method === 'PUT') {
      const auth = await getAuthUser(request, db);
      if (!auth) {
        return errorResponse('Unauthorized: Valid personnel login required.', 401);
      }
      const caseId = path.replace('/api/cases/', '').trim();
      const body = await request.json() as any;

      await db.prepare(
        `UPDATE cases
         SET suit_number = ?, judge = ?, counsel_id = ?, opposing_party = ?, opposing_counsel = ?,
             case_type = ?, subject_matter = ?, next_court_date = ?, status = ?,
             client_visible_update = ?, internal_strategy_notes = ?
         WHERE id = ? OR case_id = ?`
      ).bind(
        body.suitNumber || '', body.judge || null, body.counselId, body.opposingParty || '', body.opposingCounsel || null,
        body.caseType || 'Civil', body.subjectMatter || '', body.nextCourtDate || null, body.status || 'Hearing',
        body.clientVisibleUpdate || '', body.internalStrategyNotes || '',
        caseId, caseId
      ).run();

      await logAudit(db, auth.user.id, auth.user.name, auth.user.role, 'UPDATE_CASE', 'Case', caseId, `Updated litigation case: ${body.suitNumber || caseId}`);
      return jsonResponse({ success: true });
    }

    if (path.startsWith('/api/case-assignments/') && request.method === 'PUT') {
      // SECURITY FIX: Require authentication
      const auth = await getAuthUser(request, db);
      if (!auth) {
        return errorResponse('Unauthorized: Valid personnel login required.', 401);
      }
      const id = path.replace('/api/case-assignments/', '').trim();
      const body = await request.json() as any;
      const { status, reason, notes } = body;

      await db.prepare(
        `UPDATE case_assignments 
         SET status = ?, rejection_reason = ?, rejection_notes = ?, response_date = datetime('now')
         WHERE id = ?`
      ).bind(status, reason || null, notes || null, id).run();

      await logAudit(db, auth.user.id, auth.user.name, auth.user.role, `ASSIGNMENT_${status}`, 'CaseAssignment', id, `Counsel responded with ${status}`);
      return jsonResponse({ success: true });
    }

    // --------------------------------------------------------------------------
    // 7. COURT DIARY & TASKS
    // --------------------------------------------------------------------------
    if (path === '/api/court-diary') {
      if (request.method === 'GET') {
        // SECURITY FIX: Require authentication
        const auth = await getAuthUser(request, db);
        if (!auth) {
          return errorResponse('Unauthorized: Valid personnel login required.', 401);
        }
        const bf = branchFilterClause(auth.user);
        const rows = bf.clause
          ? await db.prepare(`SELECT * FROM court_diary ${bf.clause} ORDER BY court_date ASC`).bind(...bf.params).all<any>()
          : await db.prepare('SELECT * FROM court_diary ORDER BY court_date ASC').all<any>();
        return jsonResponse({ success: true, diary: rows.results || [] });
      }

      if (request.method === 'POST') {
        // SECURITY FIX: Require authentication
        const auth = await getAuthUser(request, db);
        if (!auth) {
          return errorResponse('Unauthorized: Valid personnel login required.', 401);
        }
        const body = await request.json() as any;
        const id = body.id || `diary-${Date.now()}`;

        await db.prepare(
          `INSERT INTO court_diary 
           (id, case_id, suit_number, branch_id, court_date, court_time, court_name, counsel_id, client_id, purpose, status, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Scheduled', ?)`
        ).bind(
          id, body.caseId, body.suitNumber, body.branchId || 'br-abuja-01', body.courtDate,
          body.courtTime || null, body.courtName, body.counselId, body.clientId, body.purpose, body.notes || ''
        ).run();

        // Update case nextCourtDate
        await db.prepare('UPDATE cases SET next_court_date = ? WHERE id = ?').bind(body.courtDate, body.caseId).run();

        return jsonResponse({ success: true, id });
      }
    }

    if (path === '/api/tasks') {
      if (request.method === 'GET') {
        // SECURITY FIX: Require authentication
        const auth = await getAuthUser(request, db);
        if (!auth) {
          return errorResponse('Unauthorized: Valid personnel login required.', 401);
        }
        const bf = branchFilterClause(auth.user);
        const rows = bf.clause
          ? await db.prepare(`SELECT * FROM tasks ${bf.clause} ORDER BY due_date ASC`).bind(...bf.params).all<any>()
          : await db.prepare('SELECT * FROM tasks ORDER BY due_date ASC').all<any>();
        return jsonResponse({ success: true, tasks: rows.results || [] });
      }

      if (request.method === 'POST') {
        // SECURITY FIX: Require authentication
        const auth = await getAuthUser(request, db);
        if (!auth) {
          return errorResponse('Unauthorized: Valid personnel login required.', 401);
        }
        const body = await request.json() as any;
        const id = body.id || `task-${Date.now()}`;

        await db.prepare(
          `INSERT INTO tasks (id, title, assigned_to_id, assigned_by_id, branch_id, matter_id, case_id, priority, due_date, status, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)`
        ).bind(
          id, body.title, body.assignedToId, auth.user.id,
          body.branchId || 'br-abuja-01', body.matterId || null, body.caseId || null,
          body.priority || 'Medium', body.dueDate, body.notes || ''
        ).run();

        return jsonResponse({ success: true, id });
      }
    }

    // --------------------------------------------------------------------------
    // 8. PROPERTIES, LANDLORDS, UNITS, TENANTS & QUIT NOTICES
    // --------------------------------------------------------------------------
    if (path === '/api/properties' || path.startsWith('/api/properties/')) {
      if (request.method === 'GET') {
        // SECURITY FIX: Require authentication
        const auth = await getAuthUser(request, db);
        if (!auth) {
          return errorResponse('Unauthorized: Valid personnel login required.', 401);
        }
        const bf = branchFilterClause(auth.user);
        const rows = bf.clause
          ? await db.prepare(`SELECT * FROM properties ${bf.clause} ORDER BY created_at DESC`).bind(...bf.params).all<any>()
          : await db.prepare('SELECT * FROM properties ORDER BY created_at DESC').all<any>();
        return jsonResponse({ success: true, properties: rows.results || [] });
      }

      if (request.method === 'POST') {
        // SECURITY FIX: Require authentication
        const auth = await getAuthUser(request, db);
        if (!auth) {
          return errorResponse('Unauthorized: Valid personnel login required.', 401);
        }
        const body = await request.json() as any;
        const propertyId = body.propertyId || await getNextNumber(db, 'property', 'PROP');
        const id = body.id || `prop-${Date.now()}`;

        const regPaymentStatus = (body.registrationPaymentStatus === PROPERTY_PAYMENT_CONFIRMED && (canVerifyPayments(auth.user) || canManageBilling(auth.user)))
          ? PROPERTY_PAYMENT_CONFIRMED
          : PROPERTY_PAYMENT_PENDING;

        const regFee = body.registrationFee !== undefined ? Number(body.registrationFee) : 50000;

        await db.prepare(
          `INSERT INTO properties 
           (id, property_id, branch_id, name, property_type, address, state, lga, district, landlord_id, total_units, title_information, survey_information, legal_status, assigned_lawyer_id, related_client_id, notes, image_url, registration_payment_status, registration_fee)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id, propertyId, body.branchId || 'br-abuja-01', body.name, body.propertyType || 'Commercial Building',
          body.address, body.state || 'FCT', body.lga || 'AMAC', body.district || 'CBD', body.landlordId,
          body.totalUnits || 1, body.titleInformation || '', body.surveyInformation || '',
          body.legalStatus || 'Managed by Chambers', body.assignedLawyerId || 'usr-counsel-01',
          body.relatedClientId || null, body.notes || '', body.imageUrl || null,
          regPaymentStatus, regFee
        ).run();

        // If pending payment and fee applies, generate the registration invoice so it's tracked in billing
        let invoiceNumber: string | null = null;
        let paymentRef: string | null = null;
        let invoiceId: string | null = null;
        if (regPaymentStatus === PROPERTY_PAYMENT_PENDING && regFee > 0 && body.createInvoice !== false) {
          const landlord = await db.prepare('SELECT * FROM landlords WHERE id = ? OR landlord_id = ?').bind(body.landlordId, body.landlordId).first<any>();
          invoiceNumber = await getNextNumber(db, 'invoice', 'INV');
          paymentRef = await getNextNumber(db, 'payment', 'PAY');
          invoiceId = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const dueDate = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];
          await db.prepare(
            `INSERT INTO invoices 
             (id, invoice_number, client_name, client_email, client_phone, branch_id, purpose, service_type, service_ref, property_id, landlord_id, items, subtotal, tax_amount, total_amount, date, due_date, payment_status, payment_reference, notes)
             VALUES (?, ?, ?, ?, ?, ?, 'ADDITIONAL_PROPERTY_REGISTRATION', 'PROPERTY', ?, ?, ?, ?, ?, 0, ?, ?, ?, 'UNPAID', ?, ?)`
          ).bind(
            invoiceId, invoiceNumber,
            landlord ? `${landlord.full_name} (Landlord)` : `${body.name} (Landlord)`,
            landlord?.email || '', landlord?.phone || '',
            body.branchId || 'br-abuja-01', id, id, body.landlordId || null,
            JSON.stringify([{ description: `Property Registration & Documentation Fee — ${body.name} (${propertyId})`, amount: regFee }]),
            regFee, regFee, new Date().toISOString().split('T')[0], dueDate, paymentRef,
            `Property ID: ${propertyId}. The property becomes active only after the registration fee is verified.`
          ).run();
        }

        await logAudit(db, auth.user.id, auth.user.name, auth.user.role, 'ADD_PROPERTY', 'Property', id, `Registered property: ${body.name} (${propertyId}) [${regPaymentStatus}]`);
        return jsonResponse({ success: true, propertyId, id, invoiceNumber, paymentRef, invoiceId });
      }

      if (request.method === 'PUT') {
        // SECURITY FIX: Require authentication
        const auth = await getAuthUser(request, db);
        if (!auth) {
          return errorResponse('Unauthorized: Valid personnel login required.', 401);
        }
        const id = path.split('/')[3];
        const body = await request.json() as any;
        
        await db.prepare(
          `UPDATE properties SET
            name = COALESCE(?, name),
            property_type = COALESCE(?, property_type),
            address = COALESCE(?, address),
            state = COALESCE(?, state),
            lga = COALESCE(?, lga),
            district = COALESCE(?, district),
            legal_status = COALESCE(?, legal_status),
            registration_payment_status = COALESCE(?, registration_payment_status),
            image_url = COALESCE(?, image_url),
            notes = COALESCE(?, notes),
            total_units = COALESCE(?, total_units)
           WHERE id = ? OR property_id = ?`
        ).bind(
          body.name ?? null, body.propertyType ?? null, body.address ?? null,
          body.state ?? null, body.lga ?? null, body.district ?? null,
          body.legalStatus ?? null,
          // Only an authorized verifier/billing role may change the registration
          // payment status; other attempts are ignored (COALESCE keeps existing).
          (canVerifyPayments(auth.user) || canManageBilling(auth.user)) ? (body.registrationPaymentStatus ?? null) : null,
          body.imageUrl ?? null, body.notes ?? null, body.totalUnits ?? null,
          id, id
        ).run();

        // When property registration fee is confirmed by authorized officer, settle the linked invoice and issue receipt
        if (body.registrationPaymentStatus === PROPERTY_PAYMENT_CONFIRMED && (canVerifyPayments(auth.user) || canManageBilling(auth.user))) {
          const linkedInvoice = await db.prepare(
            `SELECT * FROM invoices 
             WHERE (service_ref = ? OR property_id = ? OR service_ref = (SELECT id FROM properties WHERE id = ? OR property_id = ? LIMIT 1))
               AND service_type = 'PROPERTY' AND payment_status <> ? LIMIT 1`
          ).bind(id, id, id, id, PAYMENT_STATUS_VERIFIED).first<any>();

          if (linkedInvoice) {
            await db.prepare('UPDATE invoices SET payment_status = ? WHERE id = ?').bind(PAYMENT_STATUS_VERIFIED, linkedInvoice.id).run();

            const existingReceipt = await db.prepare('SELECT receipt_number FROM receipts WHERE payment_reference = ? OR invoice_number = ? LIMIT 1').bind(linkedInvoice.payment_reference, linkedInvoice.invoice_number).first<any>();
            const receiptNumber = existingReceipt?.receipt_number || await getNextNumber(db, 'receipt', 'REC');

            const payment = await db.prepare('SELECT * FROM payments WHERE invoice_number = ? LIMIT 1').bind(linkedInvoice.invoice_number).first<any>();
            if (!payment) {
              const payId = `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
              await db.prepare(
                `INSERT INTO payments 
                 (id, payment_reference, invoice_number, invoice_id, service_type, service_ref, client_name, amount, branch_id, payment_method, payment_date, status, receipt_number, verified_by_id, verified_by_name, verification_date, verification_notes, submitted_at)
                 VALUES (?, ?, ?, ?, 'PROPERTY', ?, ?, ?, ?, 'Bank Transfer', date('now'), ?, ?, ?, ?, datetime('now'), 'Manually confirmed and verified by Accounts Officer', datetime('now'))`
              ).bind(
                payId, linkedInvoice.payment_reference, linkedInvoice.invoice_number, linkedInvoice.id,
                id, linkedInvoice.client_name, linkedInvoice.total_amount, linkedInvoice.branch_id || auth.user.branchId || 'br-abuja-01',
                PAYMENT_STATUS_VERIFIED, receiptNumber, auth.user.id, auth.user.name
              ).run();
            } else if (payment.status !== PAYMENT_STATUS_VERIFIED) {
              await db.prepare(
                `UPDATE payments SET status = ?, receipt_number = ?, verified_by_id = ?, verified_by_name = ?, verification_date = datetime('now'), verification_notes = ? WHERE id = ?`
              ).bind(PAYMENT_STATUS_VERIFIED, receiptNumber, auth.user.id, auth.user.name, 'Manually confirmed and verified by Accounts Officer', payment.id).run();
            }

            if (!existingReceipt) {
              await db.prepare(
                `INSERT OR IGNORE INTO receipts (id, receipt_number, payment_reference, invoice_number, client_name, amount, payment_method, issued_date, issued_by_id, issued_by_name)
                 VALUES (?, ?, ?, ?, ?, ?, 'Bank Transfer', datetime('now'), ?, ?)`
              ).bind(
                `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                receiptNumber, linkedInvoice.payment_reference, linkedInvoice.invoice_number,
                linkedInvoice.client_name, linkedInvoice.total_amount, auth.user.id, auth.user.name
              ).run();
            }
          }
        }

        return jsonResponse({ success: true, id });
      }
    }

    if (path === '/api/landlords') {
      if (request.method === 'GET') {
        // SECURITY FIX: Require authentication
        const auth = await getAuthUser(request, db);
        if (!auth) {
          return errorResponse('Unauthorized: Valid personnel login required.', 401);
        }
        const rows = await db.prepare('SELECT * FROM landlords ORDER BY date_registered DESC').all<any>();
        return jsonResponse({ success: true, landlords: rows.results || [] });
      }

      if (request.method === 'POST') {
        // SECURITY FIX: Require authentication
        const auth = await getAuthUser(request, db);
        if (!auth) {
          return errorResponse('Unauthorized: Valid personnel login required.', 401);
        }
        const body = await request.json() as any;
        const trackingCode = await getNextNumber(db, 'landlord', 'LAND');
        const count = await db.prepare('SELECT COUNT(*) as c FROM landlords').first<{ c: number }>();
        const landlordId = `LND-${String((count?.c || 0) + 1).padStart(4, '0')}`;
        const id = body.id || `lnd-${Date.now()}`;

        await db.prepare(
          `INSERT INTO landlords (id, landlord_id, full_name, phone, email, address, bank_details, tracking_code, branch_id, date_registered)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
        ).bind(
          id, landlordId, body.fullName, body.phone, body.email, body.address,
          body.bankDetails || '', trackingCode, body.branchId || 'br-abuja-01'
        ).run();

        return jsonResponse({ success: true, landlordId, trackingCode, id });
      }
    }

    // --------------------------------------------------------------------------
    // 8.1 PUBLIC LANDLORD / PROPERTY REGISTRATION
    // --------------------------------------------------------------------------
    // The public portal must be able to register a landlord + property and
    // generate the registration invoice WITHOUT a staff session. These endpoints
    // create records in a state that can never be mistaken for paid/active and
    // return the authoritative ids/numbers the client then pays against.
    if ((path === '/api/public/landlord-registration' || path === '/api/public/property-registration') && request.method === 'POST') {
      let body: any;
      try {
        body = await request.json();
      } catch {
        return errorResponse('Malformed registration payload.', 400);
      }

      const propertyName = String(body.propertyName || '').trim();
      const propertyAddress = String(body.propertyAddress || '').trim();
      if (!propertyName || !propertyAddress) {
        return errorResponse('Property name and address are required.', 400);
      }

      const branchId = body.branchId || 'br-abuja-01';
      const regFee = body.registrationFee !== undefined ? Number(body.registrationFee) : 50000;
      if (!Number.isFinite(regFee) || regFee < 0) {
        return errorResponse('Invalid registration fee.', 400);
      }

      const normEmail = (v: any) => String(v || '').trim().toLowerCase();
      const normPhone = (v: any) => String(v || '').replace(/[^0-9]/g, '');
      const normText = (v: any) => String(v || '').trim().toLowerCase().replace(/\s+/g, ' ');

      let landlord: any;
      let purpose: InvoicePurpose;

      if (path === '/api/public/landlord-registration') {
        // ---- New landlord -------------------------------------------------
        const fullName = String(body.fullName || '').trim();
        const phone = String(body.phone || '').trim();
        const email = normEmail(body.email);
        if (!fullName || !phone || !email) {
          return errorResponse('Landlord name, phone and email are required.', 400);
        }

        // Duplicate-landlord guard on normalized identifiers.
        const dupeLandlord = await db.prepare(
          `SELECT id, landlord_id, tracking_code FROM landlords
            WHERE LOWER(TRIM(email)) = ? OR REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'+','') LIKE ? LIMIT 1`
        ).bind(email, `%${normPhone(phone)}`).first<any>();
        if (dupeLandlord) {
          return errorResponse('A landlord matching this phone or email already exists. Please use the "existing landlord" option to add a property.', 409);
        }

        const trackingCode = await getNextNumber(db, 'landlord', 'LAND');
        const countRow = await db.prepare('SELECT COUNT(*) as c FROM landlords').first<{ c: number }>();
        const landlordId = `LND-${String((countRow?.c || 0) + 1).padStart(4, '0')}`;
        const id = `lnd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

        await db.prepare(
          `INSERT INTO landlords (id, landlord_id, full_name, phone, email, address, bank_details, tracking_code, branch_id, date_registered)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
        ).bind(
          id, landlordId, fullName, phone, email, String(body.address || '').trim(),
          String(body.bankDetails || ''), trackingCode, branchId
        ).run();

        landlord = { id, landlordId, fullName, phone, email, trackingCode, branchId };
        purpose = 'NEW_LANDLORD_PROPERTY_REGISTRATION';
      } else {
        // ---- Existing landlord adding a property --------------------------
        const code = normText(body.landlordTrackingCode);
        const verify = normText(body.phoneOrEmail);
        if (!code || !verify) {
          return errorResponse('Your landlord/property code and registered phone or email are required.', 400);
        }

        const candidate = await db.prepare(
          `SELECT * FROM landlords WHERE LOWER(TRIM(tracking_code)) = ? OR LOWER(TRIM(landlord_id)) = ? LIMIT 1`
        ).bind(code, code).first<any>();
        if (!candidate || (normEmail(candidate.email) !== verify && !normPhone(candidate.phone).includes(normPhone(verify)))) {
          return errorResponse('Landlord record not found. Please verify your code and registered phone or email.', 404);
        }

        landlord = {
          id: candidate.id, landlordId: candidate.landlord_id, fullName: candidate.full_name,
          phone: candidate.phone, email: candidate.email, trackingCode: candidate.tracking_code,
          branchId: candidate.branch_id || branchId
        };
        purpose = 'ADDITIONAL_PROPERTY_REGISTRATION';
      }

      // Duplicate-property guard for this landlord.
      const dupeProperty = await db.prepare(
        `SELECT property_id FROM properties
          WHERE landlord_id = ? AND (LOWER(TRIM(name)) = ? OR LOWER(TRIM(address)) = ?) LIMIT 1`
      ).bind(landlord.id, normText(propertyName), normText(propertyAddress)).first<any>();
      if (dupeProperty) {
        return errorResponse(`A property matching this name or address is already registered under this landlord (${dupeProperty.property_id}).`, 409);
      }

      // ---- Create the property (PENDING — cannot be mistaken for active) ---
      const propertyId = await getNextNumber(db, 'property', 'PROP');
      const propertyRowId = `prop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await db.prepare(
        `INSERT INTO properties 
         (id, property_id, branch_id, name, property_type, address, state, lga, district, landlord_id, total_units,
          title_information, survey_information, legal_status, assigned_lawyer_id, notes, image_url,
          registration_payment_status, registration_fee)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Managed by Chambers', ?, ?, ?, ?, ?)`
      ).bind(
        propertyRowId, propertyId, landlord.branchId || branchId, propertyName,
        body.propertyType || 'Commercial Building', propertyAddress,
        String(body.state || 'FCT').trim(), String(body.lga || 'AMAC').trim(), String(body.district || 'CBD').trim(),
        landlord.id, Number(body.totalUnits) || 1, String(body.titleInformation || ''), String(body.surveyInformation || ''),
        'usr-counsel-01', String(body.notes || ''), body.imageUrl || null,
        PROPERTY_PAYMENT_PENDING, regFee
      ).run();

      // ---- Create the registration invoice with an explicit purpose --------
      const invoiceNumber = await getNextNumber(db, 'invoice', 'INV');
      const paymentRef = await getNextNumber(db, 'payment', 'PAY');
      const invoiceId = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const dueDate = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];
      await db.prepare(
        `INSERT INTO invoices 
         (id, invoice_number, client_name, client_email, client_phone, branch_id, purpose, service_type, service_ref, property_id, landlord_id, items, subtotal, tax_amount, total_amount, date, due_date, payment_status, payment_reference, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'PROPERTY', ?, ?, ?, ?, ?, 0, ?, ?, ?, 'UNPAID', ?, ?)`
      ).bind(
        invoiceId, invoiceNumber, `${landlord.fullName} (Landlord)`, landlord.email, landlord.phone,
        landlord.branchId || branchId, purpose, propertyRowId, propertyRowId, landlord.id,
        JSON.stringify([{ description: `Property Registration & Title Verification Fee — ${propertyName} (${propertyId})`, amount: regFee }]),
        regFee, regFee, new Date().toISOString().split('T')[0], dueDate, paymentRef,
        `Landlord Code: ${landlord.trackingCode} · Property ID: ${propertyId}. The property becomes active and available only after the registration fee is verified.`
      ).run();

      await logAudit(
        db, 'public', landlord.fullName, 'PUBLIC', 'PUBLIC_PROPERTY_REGISTRATION', 'Property', propertyRowId,
        `Public registration (${purpose}): ${propertyName} (${propertyId}) for landlord ${landlord.trackingCode}; invoice ${invoiceNumber}`
      );

      return jsonResponse({
        success: true,
        landlord: { id: landlord.id, landlordId: landlord.landlordId, fullName: landlord.fullName, phone: landlord.phone, email: landlord.email, trackingCode: landlord.trackingCode, branchId: landlord.branchId || branchId },
        property: { id: propertyRowId, propertyId, name: propertyName, branchId: landlord.branchId || branchId, landlordId: landlord.id, registrationPaymentStatus: PROPERTY_PAYMENT_PENDING, registrationFee: regFee },
        invoice: { id: invoiceId, invoiceNumber, totalAmount: regFee, paymentStatus: INVOICE_STATUS_UNPAID, purpose },
        invoiceNumber,
        invoiceId,
        paymentRef,
        trackingCode: landlord.trackingCode,
        propertyId
      }, 201);
    }

    if (path === '/api/tenants') {
      if (request.method === 'GET') {
        // SECURITY FIX: Require authentication
        const auth = await getAuthUser(request, db);
        if (!auth) {
          return errorResponse('Unauthorized: Valid personnel login required.', 401);
        }
        const rows = await db.prepare('SELECT * FROM tenants ORDER BY date_registered DESC').all<any>();
        return jsonResponse({ success: true, tenants: rows.results || [] });
      }

      if (request.method === 'POST') {
        // SECURITY FIX: Require authentication
        const auth = await getAuthUser(request, db);
        if (!auth) {
          return errorResponse('Unauthorized: Valid personnel login required.', 401);
        }
        const body = await request.json() as any;
        const trackingCode = await getNextNumber(db, 'tenancy', 'TEN');
        const count = await db.prepare('SELECT COUNT(*) as c FROM tenants').first<{ c: number }>();
        const tenantId = `TNT-${String((count?.c || 0) + 1).padStart(4, '0')}`;
        const id = body.id || `tnt-${Date.now()}`;

        await db.prepare(
          `INSERT INTO tenants (id, tenant_id, full_name, phone, email, landlord_id, property_id, unit_number, tracking_code, occupation, status, date_registered)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', datetime('now'))`
        ).bind(
          id, tenantId, body.fullName, body.phone, body.email, body.landlordId,
          body.propertyId, body.unitNumber, trackingCode, body.occupation || ''
        ).run();

        return jsonResponse({ success: true, tenantId, trackingCode, id });
      }
    }

    if (path === '/api/quit-notices') {
      if (request.method === 'GET') {
        // SECURITY FIX: Require authentication
        const auth = await getAuthUser(request, db);
        if (!auth) {
          return errorResponse('Unauthorized: Valid personnel login required.', 401);
        }
        const rows = await db.prepare('SELECT * FROM quit_notices ORDER BY created_at DESC').all<any>();
        return jsonResponse({ success: true, quitNotices: rows.results || [] });
      }

      if (request.method === 'POST') {
        // SECURITY FIX: Require authentication
        const auth = await getAuthUser(request, db);
        if (!auth) {
          return errorResponse('Unauthorized: Valid personnel login required.', 401);
        }
        const body = await request.json() as any;
        const quitNoticeId = await getNextNumber(db, 'quit_notice', 'QUIT');
        const id = body.id || `qn-${Date.now()}`;

        await db.prepare(
          `INSERT INTO quit_notices 
           (id, quit_notice_id, tenant_id, tenant_name, property_id, property_name, landlord_id, landlord_name, unit_number, notice_type, notice_date, notice_expiry_date, reason, statutory_basis, status, issued_by_id, issued_by_name)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Issued', ?, ?)`
        ).bind(
          id, quitNoticeId, body.tenantId, body.tenantName, body.propertyId, body.propertyName,
          body.landlordId, body.landlordName, body.unitNumber, body.noticeType, body.noticeDate,
          body.noticeExpiryDate, body.reason, body.statutoryBasis,
          auth.user.id, auth.user.name
        ).run();

        return jsonResponse({ success: true, quitNoticeId, id });
      }
    }

    // --------------------------------------------------------------------------
    // 8B. LEGAL DOCUMENTS & REPOSITORY (PERSISTENT CLOUDFLARE D1 STORAGE)
    // --------------------------------------------------------------------------
    if (path === '/api/documents') {
      if (request.method === 'GET') {
        const rows = await db.prepare('SELECT * FROM documents ORDER BY upload_date DESC').all<any>();
        return jsonResponse({
          success: true,
          documents: (rows.results || []).map(d => ({
            ...d,
            documentId: d.document_id,
            branchId: d.branch_id,
            entityType: d.entity_type,
            entityId: d.entity_id,
            fileUrl: d.file_url,
            fileDataUrl: d.file_url,
            fileName: d.file_name || d.title,
            fileSize: d.file_size,
            fileType: d.file_type,
            uploadedById: d.uploaded_by_id,
            uploadedByName: d.uploaded_by_name,
            uploadDate: d.upload_date,
            isClientVisible: Boolean(d.is_client_visible),
            googleDriveLink: d.google_drive_link
          }))
        });
      }

      if (request.method === 'POST') {
        const auth = await getAuthUser(request, db);
        if (!auth) {
          return errorResponse('Unauthorized: Valid personnel login required to deposit legal documents.', 401);
        }
        const body = await request.json() as any;
        const documentId = body.documentId || await getNextNumber(db, 'document', 'DOC');
        const id = body.id || `doc-${Date.now()}`;
        const uploadDate = body.uploadDate || new Date().toISOString();

        await db.prepare(
          `INSERT INTO documents 
           (id, document_id, title, branch_id, category, entity_type, entity_id, file_url, file_size, file_type, uploaded_by_id, uploaded_by_name, version, upload_date, is_client_visible, notes, google_drive_link)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id, documentId, body.title || 'Untitled Document',
          body.branchId || auth.user.branchId || 'br-abuja-01',
          body.category || 'Other',
          body.entityType || null, body.entityId || null,
          body.fileUrl || body.fileDataUrl || null,
          body.fileSize || '', body.fileType || '',
          auth.user.id, auth.user.name,
          body.version || '1.0', uploadDate,
          body.isClientVisible ? 1 : 0,
          body.notes || '', body.googleDriveLink || null
        ).run();

        await logAudit(db, auth.user.id, auth.user.name, auth.user.role, 'DEPOSIT_DOCUMENT', 'Document', id, `Deposited legal document: ${body.title} (${documentId})`);
        return jsonResponse({
          success: true,
          document: {
            id,
            documentId,
            title: body.title,
            category: body.category,
            version: body.version || '1.0',
            uploadDate,
            uploadedById: auth.user.id,
            uploadedByName: auth.user.name,
            isClientVisible: Boolean(body.isClientVisible),
            notes: body.notes,
            googleDriveLink: body.googleDriveLink
          }
        });
      }
    }

    if (path.startsWith('/api/documents/') && request.method === 'PUT') {
      const auth = await getAuthUser(request, db);
      if (!auth) {
        return errorResponse('Unauthorized: Valid personnel login required.', 401);
      }
      const docId = path.replace('/api/documents/', '').trim();
      if (!docId) return errorResponse('Document ID required.', 400);
      const body = await request.json() as any;

      await db.prepare(
        `UPDATE documents 
         SET title = ?, category = ?, version = ?, is_client_visible = ?, notes = ?, google_drive_link = ?,
             file_url = COALESCE(?, file_url), file_size = COALESCE(?, file_size), file_type = COALESCE(?, file_type)
         WHERE id = ? OR document_id = ?`
      ).bind(
        body.title || '', body.category || '', body.version || '1.0',
        body.isClientVisible ? 1 : 0, body.notes || '', body.googleDriveLink || null,
        body.fileUrl || body.fileDataUrl || null, body.fileSize || null, body.fileType || null,
        docId, docId
      ).run();

      await logAudit(db, auth.user.id, auth.user.name, auth.user.role, 'UPDATE_DOCUMENT', 'Document', docId, `Updated document: ${body.title || docId}`);
      return jsonResponse({ success: true, message: 'Document updated successfully.' });
    }

    if (path.startsWith('/api/documents/') && request.method === 'DELETE') {
      const auth = await getAuthUser(request, db);
      if (!auth) {
        return errorResponse('Unauthorized: Valid personnel login required.', 401);
      }
      if (auth.user.role !== 'PRINCIPAL_PARTNER' && auth.user.role !== 'HEAD_OF_CHAMBER' && auth.user.role !== 'ADMINISTRATOR_SECRETARY') {
        return errorResponse('Unauthorized: Only authorized personnel can delete documents.', 403);
      }
      const docId = path.replace('/api/documents/', '').trim();
      if (!docId) return errorResponse('Document ID required.', 400);

      const existing = await db.prepare('SELECT id, document_id, title FROM documents WHERE id = ? OR document_id = ?').bind(docId, docId).first<any>();
      if (!existing) return errorResponse('Document not found.', 404);

      await db.prepare('DELETE FROM documents WHERE id = ?').bind(existing.id).run();
      await logAudit(db, auth.user.id, auth.user.name, auth.user.role, 'DELETE_DOCUMENT', 'Document', existing.id, `Permanently deleted document: ${existing.title} (${existing.document_id})`);
      return jsonResponse({ success: true, message: `Document ${existing.title} permanently deleted.` });
    }

    // --------------------------------------------------------------------------
    // 8C. PUBLIC NOTICES (D1 PERSISTENCE)
    // --------------------------------------------------------------------------
    if (path === '/api/public-notices') {
      if (request.method === 'GET') {
        const rows = await db.prepare('SELECT * FROM public_notices ORDER BY publish_date DESC').all<any>();
        return jsonResponse({ success: true, publicNotices: rows.results || [] });
      }

      if (request.method === 'POST') {
        const auth = await getAuthUser(request, db);
        if (!auth) {
          return errorResponse('Unauthorized: Valid personnel login required.', 401);
        }
        const body = await request.json() as any;
        const id = body.id || `not-${Date.now()}`;
        const publishDate = body.publishDate || new Date().toISOString().split('T')[0];

        await db.prepare(
          `INSERT INTO public_notices (id, title, category, content, publish_date, expiry_date, status, published_by_id, published_by_name)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id, body.title, body.category, body.content, publishDate,
          body.expiryDate || null, body.status || 'Published',
          auth.user.id, auth.user.name
        ).run();

        await logAudit(db, auth.user.id, auth.user.name, auth.user.role, 'CREATE_NOTICE', 'PublicNotice', id, `Published notice: ${body.title}`);
        return jsonResponse({ success: true, id });
      }
    }

    if (path.startsWith('/api/public-notices/') && request.method === 'DELETE') {
      const auth = await getAuthUser(request, db);
      if (!auth) {
        return errorResponse('Unauthorized: Valid personnel login required.', 401);
      }
      if (auth.user.role !== 'PRINCIPAL_PARTNER' && auth.user.role !== 'HEAD_OF_CHAMBER' && auth.user.role !== 'ADMINISTRATOR_SECRETARY') {
        return errorResponse('Unauthorized to delete public notices.', 403);
      }
      const noticeId = path.replace('/api/public-notices/', '').trim();
      await db.prepare('DELETE FROM public_notices WHERE id = ?').bind(noticeId).run();
      await logAudit(db, auth.user.id, auth.user.name, auth.user.role, 'DELETE_NOTICE', 'PublicNotice', noticeId, `Deleted notice: ${noticeId}`);
      return jsonResponse({ success: true });
    }

    // --------------------------------------------------------------------------
    // 8D. SPECIAL APPROVAL WORKFLOW (MULTI-LEVEL: STAFF -> HOC -> PRINCIPAL PARTNER)
    // --------------------------------------------------------------------------
    if (path === '/api/approvals') {
      if (request.method === 'GET') {
        const rows = await db.prepare('SELECT * FROM approvals ORDER BY submitted_at DESC').all<any>().catch(() => ({ results: [] }));
        return jsonResponse({ success: true, approvals: rows.results || [] });
      }

      if (request.method === 'POST') {
        const auth = await getAuthUser(request, db);
        if (!auth) {
          return errorResponse('Unauthorized: Valid personnel login required.', 401);
        }
        const body = await request.json() as any;
        const id = body.id || `appr-${Date.now()}`;
        const submittedAt = body.submittedAt || new Date().toISOString();

        await db.prepare(
          `INSERT INTO approvals 
           (id, request_type, requester_id, requester_name, requester_role, branch_id, title, description, urgency, reference_code, status, submitted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_HEAD_OF_CHAMBER', ?)`
        ).bind(
          id, body.requestType || 'Special Approval',
          auth.user.id, auth.user.name, auth.user.role,
          body.branchId || auth.user.branchId || 'br-abuja-01',
          body.title || 'Special Approval Request',
          body.description || '', body.urgency || 'Normal',
          body.referenceCode || null, submittedAt
        ).run().catch(err => {
          console.warn('Approvals insert warning:', err.message);
        });

        await logAudit(db, auth.user.id, auth.user.name, auth.user.role, 'SUBMIT_SPECIAL_APPROVAL', 'ApprovalRequest', id, `Submitted special approval: ${body.title}`);
        return jsonResponse({ success: true, id, status: 'PENDING_HEAD_OF_CHAMBER' });
      }
    }

    if (path.startsWith('/api/approvals/') && request.method === 'PUT') {
      const auth = await getAuthUser(request, db);
      if (!auth) {
        return errorResponse('Unauthorized: Valid personnel login required.', 401);
      }
      const approvalId = path.replace('/api/approvals/', '').trim();
      const body = await request.json() as any;

      if (body.action === 'FORWARD_TO_PRINCIPAL_PARTNER') {
        if (auth.user.role !== 'HEAD_OF_CHAMBER' && auth.user.role !== 'PRINCIPAL_PARTNER') {
          return errorResponse('Only Head of Chamber can forward approvals to Principal Partner.', 403);
        }
        await db.prepare(
          `UPDATE approvals 
           SET status = 'FORWARDED_TO_PRINCIPAL_PARTNER', forwarded_at = datetime('now'), forwarded_by_id = ?, forwarded_by_name = ?, forward_reason = ?
           WHERE id = ?`
        ).bind(auth.user.id, auth.user.name, body.forwardReason || 'Beyond Branch Control / Escalated to Principal Partner', approvalId).run().catch(() => {});

        await logAudit(db, auth.user.id, auth.user.name, auth.user.role, 'FORWARD_APPROVAL', 'ApprovalRequest', approvalId, `Forwarded to Principal Partner: ${body.forwardReason || ''}`);
        return jsonResponse({ success: true, status: 'FORWARDED_TO_PRINCIPAL_PARTNER' });
      }

      if (body.status === 'APPROVED' || body.status === 'REJECTED') {
        await db.prepare(
          `UPDATE approvals 
           SET status = ?, decided_at = datetime('now'), decided_by_id = ?, decided_by_name = ?, decision_notes = ?
           WHERE id = ?`
        ).bind(body.status, auth.user.id, auth.user.name, body.decisionNotes || '', approvalId).run().catch(() => {});

        await logAudit(db, auth.user.id, auth.user.name, auth.user.role, 'DECIDE_APPROVAL', 'ApprovalRequest', approvalId, `Executive Decision: ${body.status}`);
        return jsonResponse({ success: true, status: body.status });
      }

      return jsonResponse({ success: true });
    }

    // --------------------------------------------------------------------------
    // 9. PUBLIC CONSULTATION BOOKING
    // --------------------------------------------------------------------------
    if (path === '/api/consultations') {
      if (request.method === 'GET') {
        const rows = await db.prepare('SELECT * FROM consultations ORDER BY created_at DESC').all<any>();
        return jsonResponse({ success: true, consultations: rows.results || [] });
      }

      if (request.method === 'POST') {
        const body = await request.json() as any;
        const code = await getNextNumber(db, 'consultation', 'CONS');
        const invoiceNumber = await getNextNumber(db, 'invoice', 'INV');
        const paymentRef = await getNextNumber(db, 'payment', 'PAY');
        const id = `cons-${Date.now()}`;
        const invId = `inv-${Date.now()}`;
        const fee = body.feeAmount || 35000;

        // Insert consultation
        await db.prepare(
          `INSERT INTO consultations 
           (id, code, service_category, preferred_date, preferred_time, full_name, phone, email, method, brief_enquiry, supporting_documents, status, invoice_number, payment_reference, branch_id, client_visible_update)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Awaiting Payment', ?, ?, ?, ?)`
        ).bind(
          id, code, body.serviceCategory, body.preferredDate, body.preferredTime, body.fullName,
          body.phone, body.email, body.method, body.briefEnquiry, JSON.stringify(body.supportingDocuments || []),
          invoiceNumber, paymentRef, body.branchId || 'br-abuja-01',
          'Consultation request received. Invoice generated. Awaiting payment submission.'
        ).run();

        // Insert associated invoice — explicitly linked to this consultation and
        // to the branch, so branch scoping and verification can resolve it.
        await db.prepare(
          `INSERT INTO invoices 
           (id, invoice_number, client_name, client_email, client_phone, branch_id, consultation_id, consultation_code, purpose, service_type, service_ref, items, subtotal, tax_amount, total_amount, date, due_date, payment_status, payment_reference, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CONSULTATION_FEE', 'CONSULTATION', ?, ?, ?, 0, ?, ?, ?, 'UNPAID', ?, ?)`
        ).bind(
          invId, invoiceNumber, body.fullName, body.email, body.phone, body.branchId || 'br-abuja-01', id, code, id,
          JSON.stringify([{ description: `Legal Consultation Fee (${body.serviceCategory}) — ${body.method}`, amount: fee }]),
          fee, fee, new Date().toISOString().split('T')[0], body.preferredDate, paymentRef,
          `Consultation Reference: ${code}. Quote payment reference ${paymentRef} upon transfer.`
        ).run();

        return jsonResponse({
          success: true,
          consultation: { id, code, fullName: body.fullName, status: 'Awaiting Payment' },
          invoiceNumber,
          invoiceId: invId,
          paymentReference: paymentRef
        });
      }
    }

    if ((path === '/api/consultations' || path.startsWith('/api/consultations/')) && (request.method === 'PUT' || request.method === 'PATCH')) {
      const auth = await getAuthUser(request, db);
      if (!auth) {
        return errorResponse('Unauthorized: Valid personnel login required.', 401);
      }
      const targetId = path.startsWith('/api/consultations/') ? path.replace('/api/consultations/', '').trim() : '';
      let body: any;
      try {
        body = await request.json();
      } catch {
        return errorResponse('Malformed request body.', 400);
      }
      const consId = targetId || body.id || body.code;
      if (!consId) {
        return errorResponse('Consultation ID or code is required.', 400);
      }

      const existing = await db.prepare(
        'SELECT * FROM consultations WHERE id = ? OR code = ?'
      ).bind(consId, consId).first<any>();
      if (!existing) {
        return errorResponse('Consultation not found.', 404);
      }

      // If user is trying to set status to 'Consultation Confirmed' or 'Payment Verified':
      // The invoice/payment MUST have been verified, unless the actor has verifier permissions.
      const requestedStatus = body.status;
      if (requestedStatus === 'Payment Verified' || requestedStatus === 'Consultation Confirmed') {
        const invoice = await db.prepare(
          'SELECT payment_status FROM invoices WHERE invoice_number = ? OR payment_reference = ?'
        ).bind(existing.invoice_number, existing.payment_reference).first<any>();

        const isPaymentVerified = invoice?.payment_status === PAYMENT_STATUS_VERIFIED;
        const canOverride = canVerifyPayments(auth.user);
        if (!isPaymentVerified && !canOverride) {
          return errorResponse('Cannot confirm consultation: The consultation fee payment has not been verified by the Account Officer.', 403);
        }
      }

      await db.prepare(
        `UPDATE consultations
         SET status = COALESCE(?, status),
             client_visible_update = COALESCE(?, client_visible_update),
             assigned_lawyer_id = COALESCE(?, assigned_lawyer_id)
         WHERE id = ?`
      ).bind(
        body.status ?? null,
        body.clientVisibleUpdate ?? null,
        body.assignedLawyerId ?? null,
        existing.id
      ).run();

      await logAudit(
        db, auth.user.id, auth.user.name, auth.user.role, 'UPDATE_CONSULTATION', 'Consultation', existing.id,
        `Updated consultation ${existing.code} status to "${body.status || existing.status}"`
      );

      return jsonResponse({ success: true, id: existing.id, status: body.status || existing.status });
    }

    // --------------------------------------------------------------------------
    // 10. PUBLIC TRACKING (SANITIZED & SAFE)
    // --------------------------------------------------------------------------
    if (path === '/api/tracking' && request.method === 'GET') {
      const code = (url.searchParams.get('code') || '').trim();
      if (!code) {
        return errorResponse('Tracking reference code is required.', 400);
      }

      // Check client ID
      const client = await db.prepare(
        'SELECT client_id, full_name, branch_id, date_registered, conflict_check_status FROM clients WHERE UPPER(TRIM(client_id)) = UPPER(?)'
      ).bind(code).first<any>();
      if (client) {
        return jsonResponse({
          success: true,
          type: 'Client Matter Dossier',
          data: {
            reference: client.client_id,
            name: client.full_name,
            registeredDate: client.date_registered,
            status: 'Verified Chambers Client'
          }
        });
      }

      // Check tenant tracking code
      const tenant = await db.prepare(
        `SELECT t.tracking_code, t.full_name, t.unit_number, t.status, p.name as property_name
         FROM tenants t
         LEFT JOIN properties p ON t.property_id = p.id
         WHERE UPPER(TRIM(t.tracking_code)) = UPPER(?)`
      ).bind(code).first<any>();
      if (tenant) {
        return jsonResponse({
          success: true,
          type: 'Tenancy Registry Record',
          data: {
            reference: tenant.tracking_code,
            tenant: tenant.full_name,
            property: tenant.property_name,
            unit: tenant.unit_number,
            status: tenant.status
          }
        });
      }

      // Check landlord tracking code
      const landlord = await db.prepare(
        'SELECT id, tracking_code, full_name, landlord_id, date_registered FROM landlords WHERE UPPER(TRIM(tracking_code)) = UPPER(?) OR UPPER(TRIM(landlord_id)) = UPPER(?)'
      ).bind(code, code).first<any>();
      if (landlord) {
        const props = await db.prepare(
          'SELECT property_id, name, registration_payment_status, legal_status FROM properties WHERE landlord_id = ?'
        ).bind(landlord.id).all<any>();
        const propertyList = props.results || [];
        const hasPending = propertyList.some(p => p.registration_payment_status !== 'PAID_CONFIRMED');
        return jsonResponse({
          success: true,
          type: 'Estate / Landlord Portfolio',
          data: {
            reference: landlord.tracking_code,
            name: landlord.full_name,
            status: propertyList.length === 0
              ? 'Registered Landlord'
              : hasPending
              ? 'Registration Fee Awaiting Verification'
              : 'Managed by Chambers',
            properties: propertyList.map(p => ({
              propertyId: p.property_id,
              name: p.name,
              registrationStatus: p.registration_payment_status,
              status: p.registration_payment_status === 'PAID_CONFIRMED' ? 'Active & Managed' : 'Pending Fee Verification'
            }))
          }
        });
      }

      // Check property ID directly
      const property = await db.prepare(
        `SELECT p.id, p.property_id, p.name, p.property_type, p.address, p.registration_payment_status, p.legal_status, l.full_name as landlord_name, l.tracking_code as landlord_code
         FROM properties p
         LEFT JOIN landlords l ON p.landlord_id = l.id
         WHERE UPPER(TRIM(p.property_id)) = UPPER(?) OR UPPER(TRIM(p.id)) = UPPER(?)`
      ).bind(code, code).first<any>();
      if (property) {
        return jsonResponse({
          success: true,
          type: 'Property Asset Portfolio',
          data: {
            reference: property.property_id,
            name: property.name,
            propertyType: property.property_type,
            address: property.address,
            landlord: property.landlord_name,
            landlordCode: property.landlord_code,
            registrationStatus: property.registration_payment_status,
            status: property.registration_payment_status === 'PAID_CONFIRMED' ? 'Active & Managed by Chambers' : 'Pending Fee Payment & Verification'
          }
        });
      }

      // Check consultation code
      const consultation = await db.prepare(
        'SELECT code, service_category, preferred_date, method, status, client_visible_update FROM consultations WHERE UPPER(TRIM(code)) = UPPER(?)'
      ).bind(code).first<any>();
      if (consultation) {
        return jsonResponse({
          success: true,
          type: 'Client Consultation Fixture',
          data: {
            reference: consultation.code,
            category: consultation.service_category,
            scheduledDate: consultation.preferred_date,
            method: consultation.method,
            status: consultation.status,
            update: consultation.client_visible_update
          }
        });
      }

      // Check receipt number
      const receipt = await db.prepare(
        'SELECT receipt_number, payment_reference, invoice_number, client_name, amount, payment_method, issued_date FROM receipts WHERE UPPER(TRIM(receipt_number)) = UPPER(?)'
      ).bind(code).first<any>();
      if (receipt) {
        return jsonResponse({
          success: true,
          type: 'Official Payment Receipt',
          data: {
            receiptNumber: receipt.receipt_number,
            paymentReference: receipt.payment_reference,
            invoiceNumber: receipt.invoice_number,
            clientName: receipt.client_name,
            amount: receipt.amount,
            paymentMethod: receipt.payment_method,
            issuedDate: receipt.issued_date,
            status: 'VERIFIED & CLEARED'
          }
        });
      }

      // Check invoice number or payment ref
      const invoice = await db.prepare(
        'SELECT invoice_number, total_amount, payment_status, due_date FROM invoices WHERE UPPER(TRIM(invoice_number)) = UPPER(?) OR UPPER(TRIM(payment_reference)) = UPPER(?)'
      ).bind(code, code).first<any>();
      if (invoice) {
        return jsonResponse({
          success: true,
          type: 'Fee Note & Payment Verification',
          data: {
            invoiceNumber: invoice.invoice_number,
            amount: invoice.total_amount,
            status: invoice.payment_status,
            dueDate: invoice.due_date
          }
        });
      }

      return errorResponse('No official record matches the supplied tracking code. Please verify and retry.', 404);
    }

    // --------------------------------------------------------------------------
    // 11. WEBSITE CMS & CONTENT
    // --------------------------------------------------------------------------
    if (path === '/api/website-content') {
      if (request.method === 'GET') {
        const row = await db.prepare("SELECT * FROM website_content WHERE id = 'cms-main'").first<any>();
        return jsonResponse({ success: true, content: row });
      }

      if (request.method === 'PUT') {
        const auth = await getAuthUser(request, db);
        if (!auth || (auth.user.role !== 'PRINCIPAL_PARTNER' && auth.user.role !== 'HEAD_OF_CHAMBER' && auth.user.role !== 'ADMINISTRATOR_SECRETARY')) {
          return errorResponse('Unauthorized to update Chambers website content', 403);
        }

        const body = await request.json() as any;
        await db.prepare(
          `UPDATE website_content 
           SET tagline = ?, hero_headline = ?, hero_subheadline = ?, about_story = ?, about_founding_year = ?,
               office_hours_text = ?, emergency_hotline = ?, consultation_fee_standard = ?, 
               internship_policy_notice = ?, recovery_of_premises_notice = ?, invoice_bank_name = ?, 
               invoice_account_name = ?, invoice_account_number = ?, invoice_payment_method = ?,
               last_updated = datetime('now'), updated_by = ?
           WHERE id = 'cms-main'`
        ).bind(
          body.tagline, body.heroHeadline, body.heroSubheadline, body.aboutStory, body.aboutFoundingYear,
          body.officeHoursText, body.emergencyHotline, body.consultationFeeStandard,
          body.internshipPolicyNotice, body.recoveryOfPremisesNotice, body.invoiceBankName,
          body.invoiceAccountName, body.invoiceAccountNumber, body.invoicePaymentMethod,
          auth.user.name
        ).run();

        await logAudit(db, auth.user.id, auth.user.name, auth.user.role, 'UPDATE_WEBSITE_CONTENT', 'WebsiteContent', 'cms-main', 'Updated Chambers website content');
        return jsonResponse({ success: true });
      }
    }

    // --------------------------------------------------------------------------
    // 12. D1 SQL QUERY (RESTRICTED TO PRINCIPAL PARTNER, READ-ONLY)
    // --------------------------------------------------------------------------
    if (path === '/api/d1/query' && request.method === 'POST') {
      const auth = await getAuthUser(request, db);
      if (!auth || auth.user.role !== 'PRINCIPAL_PARTNER') {
        return errorResponse('Forbidden: Cloudflare D1 query console requires authenticated Principal Partner session.', 403);
      }

      const body = await request.json() as any;
      const sql = (body.sql || '').trim();
      const params = body.params || [];

      if (!sql) return errorResponse('SQL statement cannot be empty.');

      // SECURITY FIX: Only allow SELECT statements — block all writes and schema changes
      const sqlUpper = sql.toUpperCase().trim();
      const FORBIDDEN_KEYWORDS = [
        'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'ATTACH',
        'DETACH', 'REPLACE', 'PRAGMA', 'VACUUM', 'REINDEX'
      ];
      if (!sqlUpper.startsWith('SELECT') && !sqlUpper.startsWith('WITH')) {
        return errorResponse('Security restriction: Only SELECT queries are permitted on the D1 query console.', 403);
      }
      for (const keyword of FORBIDDEN_KEYWORDS) {
        if (sqlUpper.includes(keyword)) {
          return errorResponse(`Security restriction: ${keyword} statements are not permitted on the D1 query console.`, 403);
        }
      }

      try {
        const statement = db.prepare(sql);
        const bound = params.length > 0 ? statement.bind(...params) : statement;
        const result = await bound.all();

        return jsonResponse({
          success: true,
          results: result.results || [],
          meta: result.meta
        });
      } catch (err: any) {
        return errorResponse(`Query execution error: ${err.message}`, 400);
      }
    }

    return errorResponse(`Endpoint "${path}" not found.`, 404);

  } catch (err: any) {
    console.error('API Error:', err);
    return errorResponse(err.message || 'Internal server error processing D1 request.', 500);
  }
}
