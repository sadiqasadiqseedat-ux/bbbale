-- ==============================================================================
-- B. B. BALE & CO. CHAMBERS — CLOUDFLARE D1 DATABASE SCHEMA
-- SQLite / Cloudflare D1 Relational Schema for Law Firm Management System
-- ==============================================================================

-- 1. Chambers Branches
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  head_of_chamber_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Personnel, Counsel & Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  role TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  title TEXT NOT NULL,
  practice_areas TEXT NOT NULL DEFAULT '[]', -- JSON array of practice areas
  bio TEXT NOT NULL DEFAULT '',
  photo_url TEXT NOT NULL DEFAULT '',
  availability TEXT NOT NULL DEFAULT 'AVAILABLE',
  is_publicly_visible INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  account_status TEXT NOT NULL DEFAULT 'Active',
  password_hash TEXT NOT NULL DEFAULT '',
  salt TEXT NOT NULL DEFAULT '',
  requires_password_change INTEGER NOT NULL DEFAULT 1,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  last_login TEXT,
  password_changed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- 3. Nigerian Courts Directory
CREATE TABLE IF NOT EXISTS courts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  court_type TEXT NOT NULL,
  state TEXT NOT NULL,
  judicial_division TEXT NOT NULL,
  location TEXT NOT NULL,
  default_judge TEXT
);

-- 4. Partner Institutions (Nigerian Law School, Universities)
CREATE TABLE IF NOT EXISTS partner_institutions (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  address TEXT NOT NULL,
  state TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  official_email TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship_status TEXT NOT NULL DEFAULT 'Active Partner',
  notes TEXT
);

-- 5. Clients Registry
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  organization TEXT,
  client_type TEXT NOT NULL DEFAULT 'Individual',
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  state TEXT NOT NULL,
  lga TEXT NOT NULL,
  identification_type TEXT,
  identification_number TEXT,
  branch_id TEXT NOT NULL,
  assigned_lawyer_id TEXT,
  conflict_check_status TEXT NOT NULL DEFAULT 'Passed',
  conflict_check_notes TEXT,
  conflict_reviewed_by TEXT,
  date_registered TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  confidential_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (assigned_lawyer_id) REFERENCES users(id)
);

-- 6. Consultations & Public Client Bookings
CREATE TABLE IF NOT EXISTS consultations (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  service_category TEXT NOT NULL,
  preferred_date TEXT NOT NULL,
  preferred_time TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  method TEXT NOT NULL,
  brief_enquiry TEXT NOT NULL,
  supporting_documents TEXT NOT NULL DEFAULT '[]', -- JSON array
  status TEXT NOT NULL DEFAULT 'Awaiting Payment',
  invoice_number TEXT NOT NULL,
  payment_reference TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  assigned_lawyer_id TEXT,
  client_visible_update TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- 7. Matters & Retainers
CREATE TABLE IF NOT EXISTS matters (
  id TEXT PRIMARY KEY,
  matter_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  client_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  lead_counsel_id TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  stage TEXT NOT NULL DEFAULT 'Pleadings Preparation',
  engagement_date TEXT NOT NULL,
  client_visible_update TEXT NOT NULL DEFAULT '',
  privileged_internal_notes TEXT NOT NULL DEFAULT '',
  requires_principal_approval INTEGER NOT NULL DEFAULT 0,
  principal_approval_status TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (lead_counsel_id) REFERENCES users(id)
);

-- 8. Cases & Cause Lists
CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL UNIQUE,
  suit_number TEXT NOT NULL UNIQUE,
  matter_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  branch_id TEXT,
  court_id TEXT NOT NULL,
  judicial_division TEXT NOT NULL,
  judge TEXT,
  counsel_id TEXT NOT NULL,
  opposing_party TEXT NOT NULL,
  opposing_counsel TEXT,
  case_type TEXT NOT NULL,
  subject_matter TEXT NOT NULL,
  filing_date TEXT NOT NULL,
  next_court_date TEXT,
  status TEXT NOT NULL DEFAULT 'Hearing',
  client_visible_update TEXT NOT NULL DEFAULT '',
  internal_strategy_notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (matter_id) REFERENCES matters(id),
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (court_id) REFERENCES courts(id),
  FOREIGN KEY (counsel_id) REFERENCES users(id)
);

-- 9. Case Counsel Assignments
CREATE TABLE IF NOT EXISTS case_assignments (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  suit_number TEXT NOT NULL,
  branch_id TEXT,
  counsel_id TEXT NOT NULL,
  assigned_by_id TEXT NOT NULL,
  assigned_by_name TEXT NOT NULL,
  date_assigned TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  rejection_reason TEXT,
  rejection_notes TEXT,
  response_date TEXT,
  FOREIGN KEY (case_id) REFERENCES cases(id),
  FOREIGN KEY (counsel_id) REFERENCES users(id)
);

-- 10. Court Diary & Cause List Entries
CREATE TABLE IF NOT EXISTS court_diary (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  suit_number TEXT NOT NULL,
  branch_id TEXT,
  court_date TEXT NOT NULL,
  court_time TEXT,
  court_name TEXT NOT NULL,
  counsel_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Scheduled',
  outcome_summary TEXT,
  next_court_date TEXT,
  notes TEXT,
  FOREIGN KEY (case_id) REFERENCES cases(id),
  FOREIGN KEY (counsel_id) REFERENCES users(id)
);

-- 11. Tasks & Workflow Deadlines
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  assigned_to_id TEXT NOT NULL,
  assigned_by_id TEXT NOT NULL,
  branch_id TEXT,
  matter_id TEXT,
  case_id TEXT,
  priority TEXT NOT NULL DEFAULT 'Medium',
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  completion_date TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (assigned_to_id) REFERENCES users(id)
);

-- 12. Landlords & Property Owners
CREATE TABLE IF NOT EXISTS landlords (
  id TEXT PRIMARY KEY,
  landlord_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  bank_details TEXT,
  tracking_code TEXT NOT NULL UNIQUE,
  date_registered TEXT NOT NULL
);

-- 13. Managed Properties & Real Estate
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL UNIQUE,
  branch_id TEXT,
  name TEXT NOT NULL,
  property_type TEXT NOT NULL,
  address TEXT NOT NULL,
  state TEXT NOT NULL,
  lga TEXT NOT NULL,
  district TEXT NOT NULL,
  landlord_id TEXT NOT NULL,
  total_units INTEGER NOT NULL DEFAULT 1,
  title_information TEXT NOT NULL DEFAULT '',
  survey_information TEXT NOT NULL DEFAULT '',
  legal_status TEXT NOT NULL DEFAULT 'Managed by Chambers',
  assigned_lawyer_id TEXT NOT NULL,
  related_client_id TEXT,
  related_matter_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (landlord_id) REFERENCES landlords(id),
  FOREIGN KEY (assigned_lawyer_id) REFERENCES users(id)
);

-- 14. Tenants Registry
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  landlord_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  unit_number TEXT NOT NULL,
  tracking_code TEXT NOT NULL UNIQUE,
  occupation TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  date_registered TEXT NOT NULL,
  FOREIGN KEY (landlord_id) REFERENCES landlords(id),
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- 15. Tenancy Agreements & Schedules
CREATE TABLE IF NOT EXISTS tenancies (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  unit_number TEXT NOT NULL,
  rent_amount REAL NOT NULL,
  start_date TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  payment_frequency TEXT NOT NULL DEFAULT 'Annual',
  status TEXT NOT NULL DEFAULT 'Active',
  arrears_amount REAL NOT NULL DEFAULT 0,
  tenancy_agreement_doc_id TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- 16. Statutory Quit Notices
CREATE TABLE IF NOT EXISTS quit_notices (
  id TEXT PRIMARY KEY,
  quit_notice_id TEXT NOT NULL UNIQUE,
  tenant_id TEXT NOT NULL,
  tenant_name TEXT NOT NULL,
  property_id TEXT NOT NULL,
  property_name TEXT NOT NULL,
  landlord_id TEXT NOT NULL,
  landlord_name TEXT NOT NULL,
  unit_number TEXT NOT NULL,
  notice_type TEXT NOT NULL,
  notice_date TEXT NOT NULL,
  notice_expiry_date TEXT NOT NULL,
  reason TEXT NOT NULL,
  statutory_basis TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Issued',
  issued_by_id TEXT NOT NULL,
  issued_by_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- 17. Invoices & Billing
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  client_id TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  matter_id TEXT,
  branch_id TEXT,
  consultation_id TEXT,
  consultation_code TEXT,
  items TEXT NOT NULL DEFAULT '[]', -- JSON array of invoice items
  subtotal REAL NOT NULL,
  tax_amount REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL,
  date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'UNPAID',
  approval_status TEXT DEFAULT 'NONE',
  approval_request_id TEXT,
  approval_notes TEXT,
  payment_reference TEXT NOT NULL UNIQUE,
  payment_method TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 18. Verified Payment Records & Receipts
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  payment_reference TEXT NOT NULL UNIQUE,
  invoice_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  amount REAL NOT NULL,
  branch_id TEXT,
  payment_method TEXT NOT NULL,
  payment_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PAYMENT_SUBMITTED',
  bank_transaction_ref TEXT,
  receipt_number TEXT,
  verified_by_id TEXT,
  verified_by_name TEXT,
  verification_date TEXT,
  verification_notes TEXT,
  proof_document_url TEXT,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 19. Law Student Internship Profiles
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  gender TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  institution_id TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  faculty TEXT NOT NULL,
  programme TEXT NOT NULL,
  level TEXT NOT NULL,
  matric_number TEXT NOT NULL,
  placement_type TEXT NOT NULL DEFAULT 'Institution-Referred',
  placement_start_date TEXT NOT NULL,
  placement_end_date TEXT NOT NULL,
  assigned_branch_id TEXT NOT NULL,
  supervising_counsel_id TEXT NOT NULL,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'Application Received',
  completion_letter_issued INTEGER NOT NULL DEFAULT 0,
  certificate_number TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (assigned_branch_id) REFERENCES branches(id),
  FOREIGN KEY (supervising_counsel_id) REFERENCES users(id)
);

-- 20. Legal Precedents & Research
CREATE TABLE IF NOT EXISTS legal_research (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  legal_issue TEXT NOT NULL,
  branch_id TEXT,
  statutes TEXT NOT NULL,
  case_authorities TEXT NOT NULL,
  legal_notes TEXT NOT NULL,
  matter_id TEXT,
  case_id TEXT,
  counsel_id TEXT NOT NULL,
  counsel_name TEXT NOT NULL,
  date TEXT NOT NULL,
  FOREIGN KEY (counsel_id) REFERENCES users(id)
);

-- 21. Document Records
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  branch_id TEXT,
  category TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  file_url TEXT,
  file_size TEXT,
  file_type TEXT,
  uploaded_by_id TEXT NOT NULL,
  uploaded_by_name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  upload_date TEXT NOT NULL,
  is_client_visible INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  google_drive_link TEXT
);

-- 22. Public Notices & Announcements
CREATE TABLE IF NOT EXISTS public_notices (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  publish_date TEXT NOT NULL,
  expiry_date TEXT,
  status TEXT NOT NULL DEFAULT 'Published',
  published_by_id TEXT NOT NULL,
  published_by_name TEXT NOT NULL
);

-- 23. Public Enquiries
CREATE TABLE IF NOT EXISTS public_enquiries (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 24. Executive Approval Requests
CREATE TABLE IF NOT EXISTS approval_requests (
  id TEXT PRIMARY KEY,
  request_type TEXT NOT NULL,
  requester_id TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  requester_role TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reference_code TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING_PRINCIPAL_PARTNER_APPROVAL',
  submitted_at TEXT NOT NULL,
  decided_at TEXT,
  decided_by_id TEXT,
  decided_by_name TEXT,
  decision_notes TEXT
);

-- 25. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details TEXT NOT NULL
);

-- 26. Dynamic Website CMS Content
CREATE TABLE IF NOT EXISTS website_content (
  id TEXT PRIMARY KEY DEFAULT 'cms-main',
  tagline TEXT NOT NULL,
  hero_headline TEXT NOT NULL,
  hero_subheadline TEXT NOT NULL,
  about_story TEXT NOT NULL,
  about_founding_year TEXT NOT NULL,
  office_hours_text TEXT NOT NULL,
  emergency_hotline TEXT NOT NULL,
  consultation_fee_standard REAL NOT NULL,
  internship_policy_notice TEXT NOT NULL,
  recovery_of_premises_notice TEXT NOT NULL,
  invoice_bank_name TEXT NOT NULL,
  invoice_account_name TEXT NOT NULL,
  invoice_account_number TEXT NOT NULL,
  invoice_payment_method TEXT NOT NULL,
  last_updated TEXT NOT NULL,
  updated_by TEXT NOT NULL
);

-- 27. System Counters & Auto-Sequencing
CREATE TABLE IF NOT EXISTS system_counters (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL UNIQUE,
  current_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 28. Cloudflare D1 Synchronization Metadata
CREATE TABLE IF NOT EXISTS d1_sync_meta (
  id TEXT PRIMARY KEY DEFAULT 'meta',
  last_sync_timestamp TEXT,
  synced_by TEXT,
  total_records_synced INTEGER DEFAULT 0,
  schema_version TEXT DEFAULT '1.0.0'
);

-- ==============================================================================
-- INDEXES FOR FAST QUERYING & PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_branch ON users(branch_id);
CREATE INDEX IF NOT EXISTS idx_clients_branch ON clients(branch_id);
CREATE INDEX IF NOT EXISTS idx_matters_client ON matters(client_id);
CREATE INDEX IF NOT EXISTS idx_matters_branch ON matters(branch_id);
CREATE INDEX IF NOT EXISTS idx_cases_matter ON cases(matter_id);
CREATE INDEX IF NOT EXISTS idx_cases_counsel ON cases(counsel_id);
CREATE INDEX IF NOT EXISTS idx_court_diary_date ON court_diary(court_date);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_tenants_tracking ON tenants(tracking_code);
CREATE INDEX IF NOT EXISTS idx_consultations_code ON consultations(code);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
