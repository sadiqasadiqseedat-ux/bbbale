-- =========================================================================
-- B. B. BALE & CO. CHAMBERS — D1 MIGRATION 0002
-- Property Disputes (Recovery of Premises workflow)
-- Applied by: wrangler d1 migrations apply bbbale
-- =========================================================================

CREATE TABLE IF NOT EXISTS property_disputes (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  tenant_id TEXT,
  complaint_title TEXT NOT NULL,
  workflow_stage TEXT NOT NULL DEFAULT 'Complaint Received',
  notice_served_date TEXT,
  notice_expiry_date TEXT,
  counsel_in_charge_id TEXT NOT NULL,
  suit_number TEXT,
  status_summary TEXT,
  counsel_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT,
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

CREATE INDEX IF NOT EXISTS idx_property_disputes_property ON property_disputes(property_id);
CREATE INDEX IF NOT EXISTS idx_property_disputes_stage ON property_disputes(workflow_stage);
