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
const WEBSITE_MANAGER_ROLES: UserRole[] = [
  'PRINCIPAL_PARTNER',
  'HEAD_OF_CHAMBER',
  'ADMINISTRATOR_SECRETARY'
];

// Roles that can assign cases
const CASE_ASSIGNER_ROLES: UserRole[] = [
  'PRINCIPAL_PARTNER',
  'HEAD_OF_CHAMBER'
];

// Roles that can verify or reject submitted payments.
//
// All payment-verification endpoints and client permission checks should use
// this shared policy.
//
// ACCOUNT_OFFICER         — handles day-to-day payment verification.
// HEAD_OF_CHAMBER         — can verify or reject submitted payments.
// ADMINISTRATOR_SECRETARY — can verify or reject submitted payments.
// PRINCIPAL_PARTNER       — can verify or reject payments and is the only
//                           role permitted to apply administrative corrections.
export const PAYMENT_VERIFIER_ROLES: UserRole[] = [
  'ACCOUNT_OFFICER',
  'HEAD_OF_CHAMBER',
  'ADMINISTRATOR_SECRETARY',
  'PRINCIPAL_PARTNER'
];

// Roles allowed to apply an administrative correction to an already-decided
// payment, such as overturning a rejection.
// Deliberately narrower than the normal payment-verification permissions.
export const PAYMENT_CORRECTION_ROLES: UserRole[] = [
  'PRINCIPAL_PARTNER'
];

// Roles that can manage billing and invoices
const BILLING_ROLES: UserRole[] = [
  'PRINCIPAL_PARTNER',
  'HEAD_OF_CHAMBER',
  'ACCOUNT_OFFICER'
];

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

/**
 * Check whether a user is an authorized member of personnel.
 */
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
    if (!recordBranch) return true;
    return recordBranch === allowedBranch;
  });
}

/**
 * SQL WHERE clause fragment for branch filtering.
 * Returns '' for PRINCIPAL_PARTNER (no filter), or a parameterized clause
 * for other roles.
 */
export function branchFilterClause(
  user: User,
  column: string = 'branch_id'
): { clause: string; params: any[] } {
  if (user.role === 'PRINCIPAL_PARTNER') {
    return { clause: '', params: [] };
  }

  return {
    clause: `WHERE ${column} = ?`,
    params: [user.branchId]
  };
}

// Maximum failed login attempts before temporary lockout
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MINUTES = 15;
