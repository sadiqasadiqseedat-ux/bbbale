/**
 * Payment Verification Dispatch — SHARED SINGLE SOURCE OF TRUTH.
 *
 * When an authorized officer verifies a payment, the payment is flipped to
 * PAYMENT_VERIFIED and the invoice to PAYMENT_VERIFIED, but the entity the
 * invoice was actually created for must ALSO be moved out of its
 * "AWAITING PAYMENT" / "PENDING_PAYMENT" state so it appears in its operational
 * dashboard. The purpose of the invoice is what decides which entity to touch.
 *
 * This module is imported by `src/server/apiHandler.ts`, which is the API used
 * by BOTH the dev D1 shim (`src/server/devD1Adapter.ts`, wired through
 * `vite.config.ts`) and production (`functions/api/[[route]].ts`), so the
 * dispatch logic runs identically in every environment.
 *
 * The dispatch statements are composed into the caller's single `db.batch(...)`
 * so the payment/invoice/receipt/target-entity/audit writes succeed or fail as
 * one transaction.
 */

import type { D1Database, D1PreparedStatement } from '../types/worker';
import { INVOICE_PURPOSE_TYPES, type InvoicePurposeType } from '../types';

export { INVOICE_PURPOSE_TYPES };
export type { InvoicePurposeType };

export function isInvoicePurposeType(value: unknown): value is InvoicePurposeType {
  return (
    typeof value === 'string' &&
    (INVOICE_PURPOSE_TYPES as readonly string[]).includes(value.trim().toUpperCase())
  );
}

/**
 * Legacy `invoices.purpose` codes (migration 0004) map onto the canonical
 * purpose_type values, so invoices created before 0006 still dispatch.
 */
const LEGACY_PURPOSE_MAP: Record<string, InvoicePurposeType> = {
  CONSULTATION_FEE: 'CONSULTATION',
  NEW_LANDLORD_PROPERTY_REGISTRATION: 'PROPERTY_REGISTRATION',
  ADDITIONAL_PROPERTY_REGISTRATION: 'PROPERTY_ADDITION',
  PROPERTY_REGISTRATION_FEE: 'PROPERTY_REGISTRATION',
  TENANCY_NOTICE_FEE: 'TENANCY_NOTICE',
  MATTER_RETAINER: 'MATTER_RETAINER',
  INTERNSHIP_FEE: 'INTERNSHIP',
  GENERAL_BILLING: 'OTHER'
};

/**
 * Resolve the purpose of an invoice. The explicit `purpose_type` column wins;
 * otherwise fall back to the legacy purpose code, then the service type, so
 * historical invoices still resolve. Never throws — unknown purposes are OTHER.
 */
export function resolvePurposeType(invoice: any): InvoicePurposeType {
  const explicit = String(invoice?.purpose_type ?? invoice?.purposeType ?? '').trim().toUpperCase();
  if (isInvoicePurposeType(explicit)) return explicit as InvoicePurposeType;

  const legacy = String(invoice?.purpose ?? '').trim().toUpperCase();
  if (LEGACY_PURPOSE_MAP[legacy]) return LEGACY_PURPOSE_MAP[legacy];

  const service = String(invoice?.service_type ?? invoice?.serviceType ?? '').trim().toUpperCase();
  if (service === 'CONSULTATION') return 'CONSULTATION';
  if (service === 'PROPERTY') return 'PROPERTY_ADDITION';

  return 'OTHER';
}

/** Resolve the id of the entity the invoice settles. */
export function resolvePurposeEntityId(invoice: any): string | null {
  const candidate =
    invoice?.purpose_entity_id ??
    invoice?.purposeEntityId ??
    invoice?.service_ref ??
    invoice?.serviceRef ??
    invoice?.property_id ??
    invoice?.propertyId ??
    invoice?.consultation_id ??
    invoice?.consultationId ??
    null;
  const value = candidate === undefined || candidate === null ? '' : String(candidate).trim();
  return value ? value : null;
}

export interface DispatchActor {
  id: string;
  name: string;
  role?: string;
}

export interface VerificationDispatch {
  purposeType: InvoicePurposeType;
  purposeEntityId: string | null;
  /** Human-readable name of the entity that was dispatched to. */
  targetEntity: string;
  /** The resulting status change applied to the target entity (or a no-op note). */
  targetStatus: string;
  /** Target-entity update + audit log statements, in execution order. */
  statements: D1PreparedStatement[];
}

function auditStatement(
  db: D1Database,
  actor: DispatchActor,
  action: string,
  entity: string,
  entityId: string,
  details: string
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO audit_logs (id, timestamp, user_id, user_name, user_role, action, entity, entity_id, details)
       VALUES (?, datetime('now'), ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      actor.id || 'system',
      actor.name || 'System',
      actor.role || 'SYSTEM',
      action,
      entity,
      entityId,
      details
    );
}

/**
 * Build the target-entity update(s) and the verification audit row for a
 * verified payment. The caller runs the returned statements inside the same
 * batch as the payment/invoice/receipt writes.
 */
export function buildVerificationDispatch(
  db: D1Database,
  opts: {
    invoice: any;
    payment: any;
    actor: DispatchActor;
    receiptNumber?: string | null;
  }
): VerificationDispatch {
  const invoice = opts.invoice || {};
  const payment = opts.payment || {};
  const purposeType = resolvePurposeType(invoice);
  const purposeEntityId = resolvePurposeEntityId(invoice);
  const invoiceNumber = String(invoice.invoice_number ?? invoice.invoiceNumber ?? payment.invoice_number ?? '');
  const paymentId = String(payment.id ?? '');
  const receipt = opts.receiptNumber || 'n/a';

  const statements: D1PreparedStatement[] = [];
  let targetEntity = 'None';
  let targetStatus = 'Audit only';

  switch (purposeType) {
    case 'PROPERTY_REGISTRATION':
    case 'PROPERTY_ADDITION': {
      targetEntity = 'Property';
      targetStatus = 'registration_payment_status = PAID_CONFIRMED';
      statements.push(
        db
          .prepare(
            `UPDATE properties
                SET registration_payment_status = 'PAID_CONFIRMED',
                    legal_status = 'Managed by Chambers'
              WHERE id = ? OR property_id = ?`
          )
          .bind(purposeEntityId, purposeEntityId)
      );
      break;
    }
    case 'CONSULTATION': {
      targetEntity = 'Consultation';
      targetStatus = 'status = Payment Verified';
      statements.push(
        db
          .prepare(
            `UPDATE consultations
                SET status = 'Payment Verified',
                    client_visible_update = ?
              WHERE id = ? OR code = ? OR invoice_number = ?`
          )
          .bind(
            `Payment verified by Accounts. Receipt ${receipt} issued. Your consultation schedule is confirmed.`,
            purposeEntityId,
            purposeEntityId,
            invoiceNumber
          )
      );
      break;
    }
    case 'TENANCY_NOTICE': {
      targetEntity = 'QuitNotice';
      targetStatus = 'status = Active';
      statements.push(
        db
          .prepare(`UPDATE quit_notices SET status = 'Active' WHERE id = ? OR quit_notice_id = ?`)
          .bind(purposeEntityId, purposeEntityId)
      );
      break;
    }
    case 'MATTER_RETAINER': {
      targetEntity = 'Matter';
      targetStatus = 'retainer_status = PAID_CONFIRMED';
      statements.push(
        db
          .prepare(`UPDATE matters SET retainer_status = 'PAID_CONFIRMED' WHERE id = ? OR matter_id = ?`)
          .bind(purposeEntityId, purposeEntityId)
      );
      break;
    }
    case 'INTERNSHIP': {
      targetEntity = 'InternshipApplication';
      targetStatus = 'status = Payment Verified';
      statements.push(
        db
          .prepare(
            `UPDATE internship_applications
                SET status = 'Payment Verified'
              WHERE id = ? OR application_code = ?`
          )
          .bind(purposeEntityId, purposeEntityId)
      );
      break;
    }
    case 'OTHER':
    default:
      // No operational entity to activate — audit the verification only.
      targetEntity = 'None';
      targetStatus = 'Audit only';
      break;
  }

  statements.push(
    auditStatement(
      db,
      opts.actor,
      'VERIFY_PAYMENT',
      'Payment',
      paymentId,
      `Verified payment of ₦${Number(payment.amount || 0).toLocaleString()} for ${payment.client_name || ''} `
        + `(invoice ${invoiceNumber}, ref ${payment.payment_reference || 'n/a'}); `
        + `purpose_type=${purposeType}, purpose_entity_id=${purposeEntityId || 'n/a'}, `
        + `target=${targetEntity} → ${targetStatus}; receipt ${receipt} issued`
    )
  );

  return { purposeType, purposeEntityId, targetEntity, targetStatus, statements };
}
