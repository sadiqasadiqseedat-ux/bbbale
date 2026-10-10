-- ==============================================================================
-- B. B. BALE & CO. CHAMBERS — MIGRATION 0006
-- INVOICE PURPOSE TAGGING & PAYMENT VERIFICATION DISPATCH
--
-- Introduces the two canonical columns the verification dispatch reads:
--   invoices.purpose_type      — WHAT the invoice is for (drives the dispatch)
--   invoices.purpose_entity_id — WHICH record the verified payment activates
--                                 (property.id, consultation.id, quit_notice.id,
--                                  matter.id, internship application id, ...)
--
-- Existing rows are back-filled from the legacy purpose / service_type columns,
-- the consultation link and the invoice notes / first line item, so the dispatch
-- also works for historical invoices.
--
-- Idempotent: the dev D1 adapter re-runs every migration on boot and skips
-- "duplicate column" / "already exists" errors, so the ALTERs are safe to repeat.
-- ==============================================================================

-- 1. Canonical purpose columns --------------------------------------------------
ALTER TABLE invoices ADD COLUMN purpose_type TEXT;       -- INVOICE_PURPOSE_TYPES
ALTER TABLE invoices ADD COLUMN purpose_entity_id TEXT;  -- property.id / consultation.id / ...

-- 2. Retainer status on matters (MATTER_RETAINER dispatch target) ---------------
ALTER TABLE matters ADD COLUMN retainer_status TEXT;

-- 3. Indexes for purpose-based lookup / verification dispatch -------------------
CREATE INDEX IF NOT EXISTS idx_invoices_purpose_type ON invoices(purpose_type);
CREATE INDEX IF NOT EXISTS idx_invoices_purpose_entity ON invoices(purpose_type, purpose_entity_id);

-- 4. Back-fill: consultation invoices -------------------------------------------
UPDATE invoices
   SET purpose_type = 'CONSULTATION',
       purpose_entity_id = COALESCE(purpose_entity_id, service_ref, consultation_id)
 WHERE purpose_type IS NULL
   AND (service_type = 'CONSULTATION'
        OR purpose = 'CONSULTATION_FEE'
        OR (consultation_code IS NOT NULL AND TRIM(consultation_code) <> '')
        OR consultation_id IS NOT NULL);

-- 5. Back-fill: property registration / addition invoices -----------------------
UPDATE invoices
   SET purpose_type = CASE
         WHEN purpose = 'NEW_LANDLORD_PROPERTY_REGISTRATION' THEN 'PROPERTY_REGISTRATION'
         ELSE 'PROPERTY_ADDITION'
       END,
       purpose_entity_id = COALESCE(purpose_entity_id, service_ref, property_id)
 WHERE purpose_type IS NULL
   AND (service_type = 'PROPERTY'
        OR purpose IN ('NEW_LANDLORD_PROPERTY_REGISTRATION', 'ADDITIONAL_PROPERTY_REGISTRATION')
        OR property_id IS NOT NULL);

-- 6. Back-fill: infer remaining rows from notes / first line item description ---
UPDATE invoices
   SET purpose_type = 'CONSULTATION'
 WHERE purpose_type IS NULL
   AND (LOWER(COALESCE(notes, '')) LIKE '%consultation%'
        OR LOWER(COALESCE(items, '')) LIKE '%consultation%');

UPDATE invoices
   SET purpose_type = CASE
         WHEN LOWER(COALESCE(notes, '') || ' ' || COALESCE(items, '')) LIKE '%additional property%'
           THEN 'PROPERTY_ADDITION'
         ELSE 'PROPERTY_REGISTRATION'
       END,
       purpose_entity_id = COALESCE(purpose_entity_id, property_id, service_ref)
 WHERE purpose_type IS NULL
   AND (LOWER(COALESCE(notes, '') || ' ' || COALESCE(items, '')) LIKE '%property%'
        OR property_id IS NOT NULL);

UPDATE invoices
   SET purpose_type = 'TENANCY_NOTICE'
 WHERE purpose_type IS NULL
   AND (LOWER(COALESCE(notes, '') || ' ' || COALESCE(items, '')) LIKE '%quit notice%'
        OR LOWER(COALESCE(notes, '') || ' ' || COALESCE(items, '')) LIKE '%tenancy notice%');

UPDATE invoices
   SET purpose_type = 'MATTER_RETAINER'
 WHERE purpose_type IS NULL
   AND LOWER(COALESCE(notes, '') || ' ' || COALESCE(items, '')) LIKE '%retainer%';

UPDATE invoices
   SET purpose_type = 'INTERNSHIP'
 WHERE purpose_type IS NULL
   AND LOWER(COALESCE(notes, '') || ' ' || COALESCE(items, '')) LIKE '%internship%';

-- 7. Anything still untagged is explicitly OTHER --------------------------------
UPDATE invoices
   SET purpose_type = 'OTHER'
 WHERE purpose_type IS NULL;
