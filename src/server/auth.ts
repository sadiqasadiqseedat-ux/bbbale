/**
 * Server-side authorization helpers for the BBBALE API.
 *
 * Enforces role-based access control (RBAC) before any protected database
 * read or write. All privileged operations must pass through these helpers.
 */

import { User, UserRole } from '../types';
import { D1Database } from '../types/worker';

export interface AuthResult {
  user: User;
  session: any;
}

// Roles that can manage firm-wide settings and branches
const FIRM_ADMIN_ROLES: UserRole[] = ['PRINCIPAL_PARTNER'];

// Roles that can manage users
const USER_MANAGER_ROLES: UserRole[] = ['PRINCIPAL_PARTNER', 'HEAD_OF_CHAMBER'];

// Roles that can manage website content
const WEBSITE_MANAGER_ROLES: UserRole[] = ['PRINCIPAL_PARTNER', 'HEAD_OF_CHAMBER', 'ADMINISTRATOR_SECRETARY'];

// Roles that can assign cases
const CASE_ASSIGNER_ROLES: UserRole[] = ['PRINCIPAL_PARTNER', 'HEAD_OF_CHAMBER'];

// Roles that can verify payments — SINGLE SHARED POLICY.
//
// The payment-verification route previously allowed
// ACCOUNT_OFFICER + ADMINISTRATOR_SECRETARY + PRINCIPAL_PARTNER while this
// module declared only the first two. This constant is now the one policy used
// by every server endpoint and by the client UI (via canVerifyPayments):
//   - ACCOUNT_OFFICER         — performs the day-to-day verification/rejection.
//   - ADMINISTRATOR_SECRETARY — chambers administration, per approved policy.
//   - PRINCIPAL_PARTNER       — may verify directly and is the only role
//                               permitted to apply an administrative correction
//                               to an already-decided payment.
// HEAD_OF_CHAMBER is a billing manager (creates invoices) but is NOT a payment
// verifier under the firm's policy, so it is intentionally excluded here.
export const PAYMENT_VERIFIER_ROLES: UserRole[] = ['ACCOUNT_OFFICER', 'ADMINISTRATOR_SECRETARY', 'PRINCIPAL_PARTNER'];

// Roles allowed to apply an administrative correction to an already-decided
// payment (e.g. overturn a rejection). Deliberately narrower than verification.
export const PAYMENT_CORRECTION_ROLES: UserRole[] = ['PRINCIPAL_PARTNER'];

// Roles that can manage billing/invoices
const BILLING_ROLES: UserRole[] = ['PRINCIPAL_PARTNER', 'HEAD_OF_CHAMBER', 'ACCOUNT_OFFICER'];

// All authenticated personnel roles
const ALL_PERSONNEL_ROLES: UserRole[] = [
  'PRINCIPAL_PARTNER',
  'HEAD_OF_CHAMBER',
  'ADMINISTRATOR_SECRETARY',
  'ACCOUNT_OFFICER',
  'COUNSEL_STAFF'
];

export function hasRole(user: User | null, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

export function isFirmAdmin(user: User | null): boolean {
  return hasRole(user, FIRM_ADMIN_ROLES);
}

export function canManageUsers(user: User | null): boolean {
  return hasRole(user, USER_MANAGER_ROLES);
}

export function canManageWebsite(user: User | null): boolean {
  return hasRole(user, WEBSITE_MANAGER_ROLES);
}

export function canAssignCases(user: User | null): boolean {
  return hasRole(user, CASE_ASSIGNER_ROLES);
}

export function canVerifyPayments(user: User | null): boolean {
  return hasRole(user, PAYMENT_VERIFIER_ROLES);
}

export function canApplyPaymentCorrection(user: User | null): boolean {
  return hasRole(user, PAYMENT_CORRECTION_ROLES);
}

export function canManageBilling(user: User | null): boolean {
  return hasRole(user, BILLING_ROLES);
}

export function isPersonnel(user: User | null): boolean {
  return hasRole(user, ALL_PERSONNEL_ROLES);
}

/**
 * Determine which branches a user is allowed to see.
 * - PRINCIPAL_PARTNER: all branches (returns null = no filter)
 * - All others: only their own branch
 */
export function getBranchFilter(user: User): string | null {
  if (user.role === 'PRINCIPAL_PARTNER') return null;
  return user.branchId;
}

/**
 * Filter a set of records by the user's allowed branch.
 * Records without a branch_id are always included (shared/reference data).
 */
export function filterByBranch<T extends Record<string, any>>(
  records: T[],
  user: User,
  branchField: string = 'branch_id'
): T[] {
  const allowedBranch = getBranchFilter(user);
  if (allowedBranch === null) return records;
  return records.filter(r => {
    const recordBranch = r[branchField] || r.branchId;
    if (!recordBranch) return true; // shared/reference data
    return recordBranch === allowedBranch;
  });
}

/**
 * SQL WHERE clause fragment for branch filtering.
 * Returns '' for PRINCIPAL_PARTNER (no filter), or a parameterized clause for others.
 */
export function branchFilterClause(user: User, column: string = 'branch_id'): { clause: string; params: any[] } {
  if (user.role === 'PRINCIPAL_PARTNER') return { clause: '', params: [] };
  return { clause: `WHERE ${column} = ?`, params: [user.branchId] };
}

// Maximum failed login attempts before temporary lockout
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MINUTES = 15;
