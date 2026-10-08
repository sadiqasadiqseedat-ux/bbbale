-- ==============================================================================
-- B. B. BALE & CO. CHAMBERS — MIGRATION 0002: PRODUCTION SUPPORT TABLES
-- Additional tables for sessions, units, rent, appointments, disputes, and internships
-- ==============================================================================

-- 1. Server-side User Sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_active_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 2. Client Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT NOT NULL,
  purpose TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  lawyer_id TEXT NOT NULL,
  lawyer_name TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Scheduled',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (lawyer_id) REFERENCES users(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- 3. Chambers Financial Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'Office Administration',
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'Bank Transfer',
  receipt_voucher_number TEXT,
  recorded_by_id TEXT NOT NULL,
  recorded_by_name TEXT NOT NULL,
  approved_by TEXT,
  approval_status TEXT NOT NULL DEFAULT 'Approved',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (recorded_by_id) REFERENCES users(id)
);

-- 4. Legal Correspondence Register
CREATE TABLE IF NOT EXISTS correspondence (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- Incoming or Outgoing
  subject TEXT NOT NULL,
  sender_recipient TEXT NOT NULL,
  date TEXT NOT NULL,
  reference_number TEXT NOT NULL,
  matter_id TEXT,
  case_id TEXT,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Filed',
  summary TEXT NOT NULL,
  logged_by_id TEXT NOT NULL,
  document_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (logged_by_id) REFERENCES users(id)
);

-- 5. Property Units
CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  unit_number TEXT NOT NULL,
  unit_type TEXT NOT NULL DEFAULT 'Commercial Suite',
  floor TEXT,
  rental_fee REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Vacant',
  current_tenant_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- 6. Rent Payment Records
CREATE TABLE IF NOT EXISTS rent_records (
  id TEXT PRIMARY KEY,
  tenancy_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_date TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'Bank Transfer',
  receipt_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Confirmed',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tenancy_id) REFERENCES tenancies(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- 7. Property Disputes & Recovery of Premises Workflow
CREATE TABLE IF NOT EXISTS property_disputes (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  tenant_id TEXT,
  landlord_id TEXT,
  complaint_title TEXT,
  nature_of_dispute TEXT,
  workflow_stage TEXT NOT NULL DEFAULT 'Complaint Received',
  status TEXT NOT NULL DEFAULT 'Under Legal Review',
  notice_served_date TEXT,
  notice_expiry_date TEXT,
  counsel_in_charge_id TEXT,
  assigned_counsel_id TEXT,
  suit_number TEXT,
  tribunal_court TEXT,
  status_summary TEXT,
  summary TEXT,
  counsel_notes TEXT,
  date_logged TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT,
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

CREATE INDEX IF NOT EXISTS idx_property_disputes_property ON property_disputes(property_id);
CREATE INDEX IF NOT EXISTS idx_property_disputes_stage ON property_disputes(workflow_stage);

-- 8. Internship Attendance Records
CREATE TABLE IF NOT EXISTS internship_attendance (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Present',
  arrival_time TEXT,
  departure_time TEXT,
  activities_summary TEXT,
  verified_by_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 9. Internship Evaluations
CREATE TABLE IF NOT EXISTS internship_evaluations (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  evaluator_id TEXT NOT NULL,
  evaluator_name TEXT NOT NULL,
  evaluation_date TEXT NOT NULL,
  advocacy_score INTEGER NOT NULL DEFAULT 80,
  legal_research_score INTEGER NOT NULL DEFAULT 85,
  professionalism_score INTEGER NOT NULL DEFAULT 90,
  overall_grade TEXT NOT NULL DEFAULT 'Distinction',
  remarks TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (evaluator_id) REFERENCES users(id)
);

-- 10. Internship Placements
CREATE TABLE IF NOT EXISTS internship_placements (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  practice_department TEXT NOT NULL,
  supervisor_id TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (supervisor_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_expenses_branch ON expenses(branch_id);
CREATE INDEX IF NOT EXISTS idx_units_property ON units(property_id);
CREATE INDEX IF NOT EXISTS idx_rent_records_tenancy ON rent_records(tenancy_id);
CREATE INDEX IF NOT EXISTS idx_internship_attendance_student ON internship_attendance(student_id);
