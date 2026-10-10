-- ==============================================================================
-- B. B. BALE & CO. CHAMBERS — MIGRATION 0005: PROPERTY DEFAULTS & RECEIPTS SCHEMA
--
-- 1. Enforces that properties without an explicit confirmed payment default to
--    'PENDING_PAYMENT' — a missing or historical status must NEVER imply payment.
-- 2. Ensures the receipts table has all required indexes for high-integrity
--    issuance, deduplication, and lookup.
-- ==============================================================================

-- 1. Ensure any properties created with NULL, empty, or unverified status are PENDING_PAYMENT
UPDATE properties
   SET registration_payment_status = 'PENDING_PAYMENT'
 WHERE registration_payment_status IS NULL
    OR TRIM(registration_payment_status) = ''
    OR (registration_payment_status = 'PAID_CONFIRMED'
        AND id IN (
          SELECT inv.service_ref FROM invoices inv
           WHERE inv.service_type = 'PROPERTY'
             AND inv.payment_status <> 'PAYMENT_VERIFIED'
        ));

-- 2. Receipts table indexes for search and deduplication
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_receipts_invoice_number ON receipts(invoice_number);
CREATE INDEX IF NOT EXISTS idx_receipts_issued_date ON receipts(issued_date);

-- 3. Invoices index for quick property/service lookup
CREATE INDEX IF NOT EXISTS idx_invoices_property_id ON invoices(property_id);
CREATE INDEX IF NOT EXISTS idx_invoices_landlord_id ON invoices(landlord_id);
