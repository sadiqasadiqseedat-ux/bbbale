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

-- 29. Chambers Expenses & Disbursements
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  branch_id TEXT,
  account_type TEXT NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT NOT NULL,
  date TEXT NOT NULL,
  recorded_by_id TEXT NOT NULL,
  recorded_by_name TEXT NOT NULL,
  matter_id TEXT,
  property_id TEXT,
  receipt_ref TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 30. Property Rental Units
CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  unit_number TEXT NOT NULL,
  description TEXT NOT NULL,
  annual_rent REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Vacant',
  current_tenant_id TEXT,
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- 31. Rent Collection & Schedules
CREATE TABLE IF NOT EXISTS rent_records (
  id TEXT PRIMARY KEY,
  tenancy_id TEXT NOT NULL,
  tenant_name TEXT NOT NULL,
  property_id TEXT NOT NULL,
  unit_number TEXT NOT NULL,
  amount_due REAL NOT NULL,
  amount_paid REAL NOT NULL,
  due_date TEXT NOT NULL,
  payment_date TEXT,
  status TEXT NOT NULL DEFAULT 'Arrears',
  payment_reference TEXT,
  receipt_number TEXT
);

-- 32. Law Student Internship Attendance
CREATE TABLE IF NOT EXISTS internship_attendance (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  date TEXT NOT NULL,
  arrival_time TEXT NOT NULL,
  departure_time TEXT,
  status TEXT NOT NULL DEFAULT 'Present',
  supervisor_notes TEXT,
  logged_by_id TEXT NOT NULL
);

-- 33. Law Student Internship Evaluations
CREATE TABLE IF NOT EXISTS internship_evaluations (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  evaluation_date TEXT NOT NULL,
  punctuality_rating INTEGER NOT NULL DEFAULT 5,
  research_rating INTEGER NOT NULL DEFAULT 5,
  drafting_rating INTEGER NOT NULL DEFAULT 5,
  court_conduct_rating INTEGER NOT NULL DEFAULT 5,
  overall_grade TEXT NOT NULL DEFAULT 'Distinction',
  remarks TEXT,
  evaluated_by_id TEXT NOT NULL
);

-- 34. Official Chambers Correspondence
CREATE TABLE IF NOT EXISTS correspondence (
  id TEXT PRIMARY KEY,
  reference_number TEXT NOT NULL UNIQUE,
  branch_id TEXT,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  sender TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  matter_id TEXT,
  case_id TEXT,
  client_id TEXT,
  property_id TEXT,
  logged_by_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 35. Chambers Appointments & Conferences
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  counsel_id TEXT NOT NULL,
  appointment_type TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Scheduled',
  notes TEXT
);

-- 36. Roles & Role Definitions
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  role_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  permissions TEXT NOT NULL DEFAULT '[]', -- JSON array of permission keys
  is_system_role INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 37. System Permissions
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  module TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 38. General Public & Client Applications
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  application_number TEXT NOT NULL UNIQUE,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT NOT NULL,
  application_type TEXT NOT NULL, -- Consultation, Retainer, Internship, Tenancy
  branch_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Submitted',
  details TEXT NOT NULL,
  reviewed_by_id TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- 39. Litigation & Statutory Deadlines
CREATE TABLE IF NOT EXISTS deadlines (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  deadline_date TEXT NOT NULL,
  matter_id TEXT,
  case_id TEXT,
  assigned_to_id TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'High',
  status TEXT NOT NULL DEFAULT 'Pending',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (assigned_to_id) REFERENCES users(id)
);

-- 40. Property Matters & Tenancy Litigation
CREATE TABLE IF NOT EXISTS property_matters (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  matter_id TEXT,
  landlord_id TEXT NOT NULL,
  dispute_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  lead_counsel_id TEXT NOT NULL,
  court_suit_number TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (property_id) REFERENCES properties(id),
  FOREIGN KEY (landlord_id) REFERENCES landlords(id),
  FOREIGN KEY (lead_counsel_id) REFERENCES users(id)
);

-- 41. Property Escrow & Financial Transactions
CREATE TABLE IF NOT EXISTS property_transactions (
  id TEXT PRIMARY KEY,
  transaction_ref TEXT NOT NULL UNIQUE,
  property_id TEXT NOT NULL,
  unit_number TEXT,
  party_name TEXT NOT NULL,
  transaction_type TEXT NOT NULL, -- Rent Deposit, Escrow, Service Charge, Caution Fee
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  recorded_by_id TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- 42. Verified Receipts Registry
CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY,
  receipt_number TEXT NOT NULL UNIQUE,
  payment_reference TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL,
  issued_date TEXT NOT NULL,
  issued_by_id TEXT NOT NULL,
  issued_by_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (payment_reference) REFERENCES payments(payment_reference)
);

-- 43. Internship Applications
CREATE TABLE IF NOT EXISTS internship_applications (
  id TEXT PRIMARY KEY,
  application_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  level TEXT NOT NULL,
  placement_type TEXT NOT NULL,
  preferred_branch_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Application Received',
  supporting_documents TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (preferred_branch_id) REFERENCES branches(id)
);

-- 44. Internship Placements & Counsel Assignments
CREATE TABLE IF NOT EXISTS internship_placements (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  supervising_counsel_id TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (supervising_counsel_id) REFERENCES users(id)
);

-- 45. Universal Public Tracking Portal Entries
CREATE TABLE IF NOT EXISTS public_tracking (
  id TEXT PRIMARY KEY,
  tracking_code TEXT NOT NULL UNIQUE,
  entity_type TEXT NOT NULL, -- Consultation, Internship, Quit Notice, Invoice
  entity_id TEXT NOT NULL,
  public_title TEXT NOT NULL,
  status TEXT NOT NULL,
  client_visible_summary TEXT NOT NULL,
  last_updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 46. Real-Time Counsel Availability Tracker
CREATE TABLE IF NOT EXISTS counsel_availability (
  id TEXT PRIMARY KEY,
  counsel_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, IN_COURT, IN_OFFICE, IN_MEETING, ON_LEAVE
  current_location TEXT,
  return_expected_at TEXT,
  notes TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (counsel_id) REFERENCES users(id)
);

-- 47. Views for exact table aliases requested by standard CRUD modules
CREATE VIEW IF NOT EXISTS counsel AS 
  SELECT * FROM users WHERE role IN ('PRINCIPAL_PARTNER', 'HEAD_OF_CHAMBER', 'COUNSEL_STAFF');

CREATE VIEW IF NOT EXISTS court_dates AS 
  SELECT * FROM court_diary;

CREATE VIEW IF NOT EXISTS rent AS 
  SELECT * FROM rent_records;

CREATE VIEW IF NOT EXISTS internship_students AS 
  SELECT * FROM students;

CREATE VIEW IF NOT EXISTS internship_institutions AS 
  SELECT * FROM partner_institutions;

CREATE VIEW IF NOT EXISTS notices AS 
  SELECT * FROM public_notices;

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
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
