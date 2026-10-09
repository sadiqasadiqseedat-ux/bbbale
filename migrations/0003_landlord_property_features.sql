-- ==============================================================================
-- B. B. BALE & CO. CHAMBERS — MIGRATION 0003: LANDLORD PROPERTY ENHANCEMENTS
-- Adds image_url, registration_payment_status, registration_fee to properties,
-- and branch_id to landlords.
-- ==============================================================================

ALTER TABLE properties ADD COLUMN image_url TEXT;
ALTER TABLE properties ADD COLUMN registration_payment_status TEXT NOT NULL DEFAULT 'PAID_CONFIRMED';
ALTER TABLE properties ADD COLUMN registration_fee REAL DEFAULT 50000;
ALTER TABLE landlords ADD COLUMN branch_id TEXT;
