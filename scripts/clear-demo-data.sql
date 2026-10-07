-- =========================================================================
-- B. B. BALE & CO. CHAMBERS — clear demo / sample records from Cloudflare D1
-- =========================================================================
-- Purpose: remove the operational and demo rows so the firm can start
--          recording real matters, while keeping the configuration and
--          staff logins the app needs to run.
--
-- KEEPS (untouched): users, branches, courts, partner_institutions,
--                    public_notices, website_content, roles, permissions,
--                    d1_sync_meta.
-- CLEARS: every transactional table listed below, plus audit_logs (demo
--         activity history) and system_counters (so generated reference
--         numbers restart at 000001 instead of continuing the demo sequence).
--
-- 1) REVIEW what is about to be deleted (run this first, it changes nothing):
--      npx wrangler d1 execute bbbale --remote --command \
--        "SELECT 'clients' AS tbl, COUNT(*) AS n FROM clients
--         UNION ALL SELECT 'matters', COUNT(*) FROM matters
--         UNION ALL SELECT 'cases', COUNT(*) FROM cases
--         UNION ALL SELECT 'invoices', COUNT(*) FROM invoices;"
--
-- 2) APPLY (child rows are deleted before their parents, so foreign keys
--    stay satisfied; every statement is a no-op if the table is already empty,
--    so this file is safe to re-run):
--      npx wrangler d1 execute bbbale --remote --file=./scripts/clear-demo-data.sql
-- =========================================================================

-- --- Billing / finance (receipts reference payments) ---------------------
DELETE FROM receipts;
DELETE FROM payments;
DELETE FROM invoices;
DELETE FROM expenses;

-- --- Front-desk / enquiries / correspondence -----------------------------
DELETE FROM public_tracking;
DELETE FROM public_enquiries;
DELETE FROM approval_requests;
DELETE FROM appointments;
DELETE FROM correspondence;
DELETE FROM documents;
DELETE FROM deadlines;
DELETE FROM tasks;
DELETE FROM legal_research;
DELETE FROM counsel_availability;

-- --- Litigation (children of cases, matters, clients) --------------------
DELETE FROM case_assignments;
DELETE FROM court_diary;
DELETE FROM cases;
DELETE FROM matters;
DELETE FROM consultations;
DELETE FROM clients;

-- --- Property & tenancy (children of properties, tenants, landlords) ------
DELETE FROM quit_notices;
DELETE FROM tenancies;
DELETE FROM rent_records;
DELETE FROM property_transactions;
DELETE FROM property_disputes;
DELETE FROM property_matters;
DELETE FROM units;
DELETE FROM tenants;
DELETE FROM properties;
DELETE FROM landlords;

-- --- Interns & recruitment (placements reference students) ---------------
DELETE FROM internship_attendance;
DELETE FROM internship_evaluations;
DELETE FROM internship_placements;
DELETE FROM students;
DELETE FROM internship_applications;
DELETE FROM applications;

-- --- Demo activity history and reference-number counters -----------------
DELETE FROM audit_logs;
DELETE FROM system_counters;

-- =========================================================================
-- Verification — every row below must report 0 remaining.
-- =========================================================================
SELECT 'clients' AS tbl, COUNT(*) AS remaining FROM clients
UNION ALL SELECT 'consultations', COUNT(*) FROM consultations
UNION ALL SELECT 'matters', COUNT(*) FROM matters
UNION ALL SELECT 'cases', COUNT(*) FROM cases
UNION ALL SELECT 'case_assignments', COUNT(*) FROM case_assignments
UNION ALL SELECT 'court_diary', COUNT(*) FROM court_diary
UNION ALL SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL SELECT 'deadlines', COUNT(*) FROM deadlines
UNION ALL SELECT 'documents', COUNT(*) FROM documents
UNION ALL SELECT 'correspondence', COUNT(*) FROM correspondence
UNION ALL SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL SELECT 'approval_requests', COUNT(*) FROM approval_requests
UNION ALL SELECT 'public_enquiries', COUNT(*) FROM public_enquiries
UNION ALL SELECT 'public_tracking', COUNT(*) FROM public_tracking
UNION ALL SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'receipts', COUNT(*) FROM receipts
UNION ALL SELECT 'expenses', COUNT(*) FROM expenses
UNION ALL SELECT 'landlords', COUNT(*) FROM landlords
UNION ALL SELECT 'properties', COUNT(*) FROM properties
UNION ALL SELECT 'units', COUNT(*) FROM units
UNION ALL SELECT 'tenants', COUNT(*) FROM tenants
UNION ALL SELECT 'tenancies', COUNT(*) FROM tenancies
UNION ALL SELECT 'quit_notices', COUNT(*) FROM quit_notices
UNION ALL SELECT 'rent_records', COUNT(*) FROM rent_records
UNION ALL SELECT 'property_matters', COUNT(*) FROM property_matters
UNION ALL SELECT 'property_transactions', COUNT(*) FROM property_transactions
UNION ALL SELECT 'property_disputes', COUNT(*) FROM property_disputes
UNION ALL SELECT 'students', COUNT(*) FROM students
UNION ALL SELECT 'internship_applications', COUNT(*) FROM internship_applications
UNION ALL SELECT 'internship_placements', COUNT(*) FROM internship_placements
UNION ALL SELECT 'internship_attendance', COUNT(*) FROM internship_attendance
UNION ALL SELECT 'internship_evaluations', COUNT(*) FROM internship_evaluations
UNION ALL SELECT 'applications', COUNT(*) FROM applications
UNION ALL SELECT 'legal_research', COUNT(*) FROM legal_research
UNION ALL SELECT 'counsel_availability', COUNT(*) FROM counsel_availability
UNION ALL SELECT 'audit_logs', COUNT(*) FROM audit_logs
UNION ALL SELECT 'system_counters', COUNT(*) FROM system_counters;

-- Kept tables (for reference — these should be NON-zero):
SELECT 'users' AS tbl, COUNT(*) AS remaining FROM users
UNION ALL SELECT 'branches', COUNT(*) FROM branches
UNION ALL SELECT 'courts', COUNT(*) FROM courts
UNION ALL SELECT 'partner_institutions', COUNT(*) FROM partner_institutions
UNION ALL SELECT 'public_notices', COUNT(*) FROM public_notices
UNION ALL SELECT 'website_content', COUNT(*) FROM website_content;
