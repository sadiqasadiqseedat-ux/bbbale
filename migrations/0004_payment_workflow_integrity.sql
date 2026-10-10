-- ==============================================================================
-- B. B. BALE & CO. CHAMBERS — MIGRATION 0004: PAYMENT WORKFLOW INTEGRITY
--
-- Adds explicit, validated relationships between invoices, payments and the
-- paid service they settle (consultation / property / general billing), and
-- the durable `receipts` linkage that the verification flow was missing.
--
-- ADDITIVE ONLY. This migration never rewrites historical financial records:
--   * every new column is nullable (existing rows keep their data untouched);
--   * the only UPDATE touches NULL/empty property registration statuses, which
--     can never be mistaken for a settled payment, and maps them to
--     PENDING_PAYMENT so a missing status no longer implies "paid".
--
-- Idempotent: the dev D1 adapter re-applies every migration on boot and skips
-- "duplicate column"/"already exists" errors, so these ALTERs are safe to run
-- repeatedly.
-- ==============================================================================

-- 1. Invoice → paid-service relationship (what the client is paying for)
ALTER TABLE invoices ADD COLUMN purpose TEXT;          -- INVOICE_PURPOSE_* code
ALTER TABLE invoices ADD COLUMN service_type TEXT;     -- CONSULTATION | PROPERTY | GENERAL
ALTER TABLE invoices ADD COLUMN service_ref TEXT;      -- id of the linked consultation/property
ALTER TABLE invoices ADD COLUMN property_id TEXT;      -- properties.id when the invoice is a property fee
ALTER TABLE invoices ADD COLUMN landlord_id TEXT;      -- landlords.id for registration fees

-- 2. Payment → invoice / paid-service relationship (explicit, not inferred)
ALTER TABLE payments ADD COLUMN invoice_id TEXT;       -- invoices.id the payment settles
ALTER TABLE payments ADD COLUMN service_type TEXT;     -- copied from the invoice at submission
ALTER TABLE payments ADD COLUMN service_ref TEXT;      -- copied from the invoice at submission

-- 3. Receipt integrity: at most one durable receipt per payment submission
--    (receipt_number is already UNIQUE; this prevents a second receipt row for
--    the same payment_reference).
CREATE UNIQUE INDEX IF NOT EXISTS idx_receipts_payment_ref ON receipts(payment_reference);

-- 4. Payment lookup / duplicate-submission indexes
CREATE INDEX IF NOT EXISTS idx_payments_invoice_number ON payments(invoice_number);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_reference ON invoices(payment_reference);
CREATE INDEX IF NOT EXISTS idx_invoices_service_ref ON invoices(service_type, service_ref);

-- 5. Defensive normalisation: a missing/blank property registration status must
--    never be read as paid. Only NULL/empty values are touched.
UPDATE properties
   SET registration_payment_status = 'PENDING_PAYMENT'
 WHERE registration_payment_status IS NULL
    OR TRIM(registration_payment_status) = '';

-- 6. Backfill explicit links for invoices that already carry a consultation
--    reference, so historical consultation invoices still resolve to their
--    service without fuzzy matching. Only rows that are still NULL are set.
UPDATE invoices
   SET service_type = 'CONSULTATION',
       service_ref  = consultation_code,
       purpose      = COALESCE(purpose, 'CONSULTATION_FEE')
 WHERE consultation_code IS NOT NULL
   AND TRIM(consultation_code) <> ''
   AND service_type IS NULL;
