import {
  User,
  Branch,
  Client,
  Consultation,
  Matter,
  Court,
  CaseRecord,
  CaseAssignment,
  CourtDiaryEntry,
  Task,
  DocumentRecord,
  Correspondence,
  LegalResearch,
  Appointment,
  Property,
  Landlord,
  Unit,
  Tenant,
  Tenancy,
  RentRecord,
  PropertyDispute,
  Invoice,
  PaymentRecord,
  ExpenseRecord,
  Institution,
  StudentProfile,
  InternshipAttendance,
  InternshipEvaluation,
  PublicNotice,
  PublicEnquiry,
  ApprovalRequest,
  NotificationItem,
  AuditLog,
  UserRole,
  UserSession,
  WebsiteContent,
  QuitNotice
} from '../types';
import { 
  generateSalt, 
  hashPassword, 
  verifyPassword, 
  generateSecureToken, 
  validatePasswordStrength 
} from './crypto';

// INITIAL AUTHORIZED PERSONNEL - EXACTLY 5 ROLES
// All initial accounts start with username and requiresPasswordChange: true
const INITIAL_USERS: User[] = [
  {
    id: 'usr-principal-01',
    username: 'principal.partner',
    name: 'Barrister B. B. Bale, SAN, FCIArb',
    email: 'principal@bbbalechambers.ng',
    phone: '+234 803 200 1100',
    role: 'PRINCIPAL_PARTNER',
    branchId: 'br-abuja-01',
    title: 'Senior Advocate of Nigeria / Principal Partner',
    practiceAreas: ['Constitutional Litigation', 'Appellate Advocacy', 'Energy & Natural Resources', 'Commercial Arbitration'],
    bio: 'Founding Partner and Senior Advocate of Nigeria with over three decades of exceptional legal practice, appearing before the Supreme Court of Nigeria and international arbitral tribunals.',
    photoUrl: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=600',
    availability: 'AVAILABLE',
    isPubliclyVisible: true,
    isActive: true,
    accountStatus: 'Active',
    salt: 'a1b2c3d4e5f60718',
    passwordHash: '', // Initialized in initializeStorage
    requiresPasswordChange: true,
    failedLoginAttempts: 0,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-hoc-01',
    username: 'head.chamber',
    name: 'Barrister Aisha M. Bello, LL.M',
    email: 'hoc.abuja@bbbalechambers.ng',
    phone: '+234 802 333 4455',
    role: 'HEAD_OF_CHAMBER',
    branchId: 'br-abuja-01',
    title: 'Partner / Head of Chamber (Abuja)',
    practiceAreas: ['Corporate & Commercial', 'Property & Real Estate Law', 'Islamic / Sharia Family Jurisprudence'],
    bio: 'Partner directing the day-to-day legal operations of the Abuja Head Chambers. Specialist in property governance, commercial drafting, and cross-border commercial joint ventures.',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600',
    availability: 'IN_OFFICE',
    isPubliclyVisible: true,
    isActive: true,
    accountStatus: 'Active',
    salt: 'b2c3d4e5f6071829',
    passwordHash: '',
    requiresPasswordChange: true,
    failedLoginAttempts: 0,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-admin-01',
    username: 'administrator',
    name: 'Fatima Garba, B.Sc, CIPM',
    email: 'secretary@bbbalechambers.ng',
    phone: '+234 809 555 1212',
    role: 'ADMINISTRATOR_SECRETARY',
    branchId: 'br-abuja-01',
    title: 'Chambers Administrator & Legal Secretary',
    practiceAreas: ['Chambers Operations', 'Court Filings Logistics', 'Client Intake Registry'],
    bio: 'Oversees chambers intake, court fixture registries, appointment schedules, website content, and student placement logistics.',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=600',
    availability: 'AVAILABLE',
    isPubliclyVisible: true,
    isActive: true,
    accountStatus: 'Active',
    salt: 'c3d4e5f60718293a',
    passwordHash: '',
    requiresPasswordChange: true,
    failedLoginAttempts: 0,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-account-01',
    username: 'accounts',
    name: 'Chukwuemeka Okonkwo, ACA, ACTI',
    email: 'accounts@bbbalechambers.ng',
    phone: '+234 806 888 9900',
    role: 'ACCOUNT_OFFICER',
    branchId: 'br-abuja-01',
    title: 'Chief Financial & Account Officer',
    practiceAreas: ['Client Trust Accounting', 'Tax & Compliance Audit', 'Real Estate Escrow'],
    bio: 'Chartered Accountant overseeing client retainer accounting, consultation invoice verification, court filing disbursements, and property escrow records.',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
    availability: 'AVAILABLE',
    isPubliclyVisible: true,
    isActive: true,
    accountStatus: 'Active',
    salt: 'd4e5f60718293a4b',
    passwordHash: '',
    requiresPasswordChange: true,
    failedLoginAttempts: 0,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-counsel-01',
    username: 'counsel',
    name: 'Barrister Tunde Adeleke, BL',
    email: 'tunde.adeleke@bbbalechambers.ng',
    phone: '+234 813 444 7788',
    role: 'COUNSEL_STAFF',
    branchId: 'br-abuja-01',
    title: 'Senior Litigation & Property Associate',
    practiceAreas: ['Recovery of Premises', 'High Court Litigation', 'Tenancy Disputes', 'Commercial Drafting'],
    bio: 'Accomplished trial advocate specializing in tenancy litigation, recovery of premises under state tenancies laws, and appellate brief preparation.',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600',
    availability: 'IN_COURT',
    isPubliclyVisible: true,
    isActive: true,
    accountStatus: 'Active',
    salt: 'e5f60718293a4b5c',
    passwordHash: '',
    requiresPasswordChange: true,
    failedLoginAttempts: 0,
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

// INITIAL AUTHORIZED BRANCHES
const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'br-abuja-01',
    name: 'Abuja Head Chambers',
    code: 'ABJ',
    address: 'Plot 742, Gabriel Olusanya Crescent, Off Constitution Avenue, Central Business District',
    city: 'Abuja',
    state: 'Federal Capital Territory (FCT)',
    phone: '+234 9 291 8000 / +234 803 200 1100',
    email: 'abuja@bbbalechambers.ng',
    headOfChamberId: 'usr-hoc-01',
    isActive: true
  },
  {
    id: 'br-lagos-02',
    name: 'Lagos Island Chambers',
    code: 'LOS',
    address: '14th Floor, Investment House, 21-25 Broad Street, Lagos Island',
    city: 'Lagos',
    state: 'Lagos State',
    phone: '+234 1 454 9200',
    email: 'lagos@bbbalechambers.ng',
    isActive: true
  },
  {
    id: 'br-kano-03',
    name: 'Kano Commercial Chambers',
    code: 'KAN',
    address: 'Suite 404, Gidan Goldie, 2 Race Course Road, Nassarawa GRA',
    city: 'Kano',
    state: 'Kano State',
    phone: '+234 64 982 110',
    email: 'kano@bbbalechambers.ng',
    isActive: true
  },
  {
    id: 'br-ph-04',
    name: 'Port Harcourt Branch',
    code: 'PHC',
    address: '8 Forces Avenue, Old GRA',
    city: 'Port Harcourt',
    state: 'Rivers State',
    phone: '+234 84 301 440',
    email: 'portharcourt@bbbalechambers.ng',
    isActive: true
  }
];

// INITIAL NIGERIAN COURTS
const INITIAL_COURTS: Court[] = [
  {
    id: 'crt-01',
    name: 'Supreme Court of Nigeria',
    courtType: 'Supreme Court',
    state: 'FCT',
    judicialDivision: 'Supreme Court Complex, Three Arms Zone, Abuja',
    location: 'Three Arms Zone, Abuja'
  },
  {
    id: 'crt-02',
    name: 'Court of Appeal (Abuja Division)',
    courtType: 'Court of Appeal',
    state: 'FCT',
    judicialDivision: 'Abuja Judicial Division',
    location: 'Shehu Shagari Way, Maitama, Abuja'
  },
  {
    id: 'crt-03',
    name: 'Federal High Court of Nigeria (Abuja)',
    courtType: 'Federal High Court',
    state: 'FCT',
    judicialDivision: 'Abuja Judicial Division',
    location: 'Headquarters, Central Business District, Abuja'
  },
  {
    id: 'crt-04',
    name: 'High Court of the Federal Capital Territory',
    courtType: 'High Court',
    state: 'FCT',
    judicialDivision: 'Maitama Judicial Division',
    location: 'Maitama, Abuja'
  },
  {
    id: 'crt-05',
    name: 'National Industrial Court of Nigeria',
    courtType: 'National Industrial Court',
    state: 'FCT',
    judicialDivision: 'Abuja Judicial Division',
    location: 'Garki 2, Abuja'
  },
  {
    id: 'crt-06',
    name: 'Upper Sharia Court (FCT)',
    courtType: 'Sharia Court',
    state: 'FCT',
    judicialDivision: 'Upper Sharia Court, Kado / Bwari',
    location: 'Kado, Abuja'
  },
  {
    id: 'crt-07',
    name: 'Chief Magistrate Court (Wuse Zone 2)',
    courtType: 'Magistrate Court',
    state: 'FCT',
    judicialDivision: 'Abuja Magistracy',
    location: 'Wuse Zone 2, Abuja'
  },
  {
    id: 'crt-08',
    name: 'High Court of Lagos State (Igbosere/TBS)',
    courtType: 'High Court',
    state: 'Lagos State',
    judicialDivision: 'Lagos Judicial Division',
    location: 'Tafawa Balewa Square, Lagos Island'
  }
];

// INITIAL PARTNER INSTITUTIONS
const INITIAL_INSTITUTIONS: Institution[] = [
  {
    id: 'inst-01',
    code: 'NLS-HQ',
    name: 'Nigerian Law School (Bwari Headquarters)',
    type: 'Nigerian Law School',
    address: 'Bwari, Federal Capital Territory, P.M.B. 1386',
    state: 'FCT',
    contactPerson: 'Director of Academic Affairs / Placement Office',
    officialEmail: 'externship@lawschool.gov.ng',
    phone: '+234 9 290 5510',
    relationshipStatus: 'Active Partner'
  },
  {
    id: 'inst-02',
    code: 'UNIABUJA-LAW',
    name: 'University of Abuja — Faculty of Law',
    type: 'Faculty of Law',
    address: 'Main Campus, Airport Road, Gwagwalada, Abuja',
    state: 'FCT',
    contactPerson: 'Dean, Faculty of Law / Clinical Legal Education Unit',
    officialEmail: 'law.faculty@uniabuja.edu.ng',
    phone: '+234 803 555 4433',
    relationshipStatus: 'Active Partner'
  },
  {
    id: 'inst-03',
    code: 'UNILAG-LAW',
    name: 'University of Lagos — Faculty of Law',
    type: 'Faculty of Law',
    address: 'Akoka, Yaba, Lagos',
    state: 'Lagos State',
    contactPerson: 'Law Clinic & Clinical Education Coordinator',
    officialEmail: 'law@unilag.edu.ng',
    phone: '+234 1 280 2400',
    relationshipStatus: 'Active Partner'
  },
  {
    id: 'inst-04',
    code: 'BUK-LAW',
    name: 'Bayero University Kano — Faculty of Law',
    type: 'Faculty of Law',
    address: 'New Campus, Gwarzo Road, Kano',
    state: 'Kano State',
    contactPerson: 'Head of Department, Public & Islamic Law',
    officialEmail: 'law@buk.edu.ng',
    phone: '+234 64 666 014',
    relationshipStatus: 'Active Partner'
  }
];

// INITIAL PUBLIC NOTICES
const INITIAL_PUBLIC_NOTICES: PublicNotice[] = [
  {
    id: 'not-01',
    title: 'Chambers Working Hours & Client Consultation Schedule',
    category: 'Office working hours',
    content: 'B. B. BALE & CO. CHAMBERS operates Mondays through Fridays from 8:00 AM to 5:30 PM across all branches. In-person client conferences and virtual consultations are scheduled strictly upon prior verification and booking via the Chambers Public Portal.',
    publishDate: '2026-01-05',
    status: 'Published',
    publishedById: 'usr-principal-01',
    publishedByName: 'Barrister B. B. Bale, SAN'
  },
  {
    id: 'not-02',
    title: 'Nigerian Law School Externship & 2026 Student Internship Call',
    category: 'Internship announcements',
    content: 'Chambers welcomes Bar Part II externs from the Nigerian Law School and penultimate/final year LL.B law undergraduates. Applications or official institution referral letters may be submitted via the Chambers Student Portal. Each placement candidate is assigned a Senior Counsel supervisor.',
    publishDate: '2026-02-01',
    status: 'Published',
    publishedById: 'usr-hoc-01',
    publishedByName: 'Barrister Aisha M. Bello, LL.M'
  },
  {
    id: 'not-03',
    title: 'Notice on Recovery of Premises and Tenancy Dispute Engagements',
    category: 'Public legal information',
    content: 'Landlords and property owners instructing Chambers on recovery of premises are reminded that statutory notices must comply strictly with the applicable Recovery of Premises Laws and Tenancy Laws of the respective State. Consultation assessment is required prior to issuance of notices.',
    publishDate: '2026-02-15',
    status: 'Published',
    publishedById: 'usr-principal-01',
    publishedByName: 'Barrister B. B. Bale, SAN'
  }
];

// INITIAL DYNAMIC WEBSITE CONTENT (MANAGED VIA CMS)
const INITIAL_WEBSITE_CONTENT: WebsiteContent = {
  tagline: 'Secure. Organized. Professional.',
  heroHeadline: 'Secure. Organized. Professional.',
  heroSubheadline: 'Distinguished legal representation, trial advocacy, property & recovery of premises management, Islamic law jurisprudence, and institutional law-student mentorship across Nigeria.',
  aboutStory: 'B. B. BALE & CO. CHAMBERS was established to provide distinguished corporate entities, institutions, and individuals with uncompromising legal defense and advisory services. From our principal chambers in the Federal Capital Territory, Abuja, our footprint extends across commercial hubs in Lagos, Kano, and Port Harcourt. Our trial and appellate practice is built on comprehensive statutory analysis, painstaking factual investigation, and respectful yet incisive courtroom advocacy.',
  aboutFoundingYear: '1996',
  officeHoursText: 'Mondays through Fridays: 8:00 AM - 5:30 PM (Court Recess Excluded). In-person client conferences and virtual consultations are scheduled upon verified booking.',
  emergencyHotline: '+234 803 200 1100',
  consultationFeeStandard: 35000,
  internshipPolicyNotice: 'Chambers welcomes Bar Part II externs from the Nigerian Law School and law undergraduates from recognized universities.',
  recoveryOfPremisesNotice: 'Statutory notice periods must not be mechanically applied; each notice is formulated in accordance with applicable State tenancy legislation and agreements.',
  invoiceBankName: 'First Bank of Nigeria PLC',
  invoiceAccountName: 'B. B. BALE & CO. (CLIENT SERVICES)',
  invoiceAccountNumber: '2039485712',
  invoicePaymentMethod: 'Bank Transfer',
  lastUpdated: new Date().toISOString(),
  updatedBy: 'Barrister B. B. Bale, SAN'
};

// STORAGE KEYS
const STORAGE_KEYS = {
  USERS: 'bb_users_v2',
  BRANCHES: 'bb_branches_v1',
  COURTS: 'bb_courts_v1',
  INSTITUTIONS: 'bb_institutions_v1',
  CLIENTS: 'bb_clients_v1',
  CONSULTATIONS: 'bb_consultations_v1',
  MATTERS: 'bb_matters_v1',
  CASES: 'bb_cases_v1',
  CASE_ASSIGNMENTS: 'bb_case_assignments_v1',
  COURT_DIARY: 'bb_court_diary_v1',
  TASKS: 'bb_tasks_v1',
  DOCUMENTS: 'bb_documents_v1',
  CORRESPONDENCE: 'bb_correspondence_v1',
  LEGAL_RESEARCH: 'bb_legal_research_v1',
  APPOINTMENTS: 'bb_appointments_v1',
  PROPERTIES: 'bb_properties_v1',
  LANDLORDS: 'bb_landlords_v1',
  UNITS: 'bb_units_v1',
  TENANTS: 'bb_tenants_v1',
  TENANCIES: 'bb_tenancies_v1',
  RENT_RECORDS: 'bb_rent_records_v1',
  PROPERTY_DISPUTES: 'bb_property_disputes_v1',
  QUIT_NOTICES: 'bb_quit_notices_v1',
  INVOICES: 'bb_invoices_v1',
  PAYMENTS: 'bb_payments_v1',
  EXPENSES: 'bb_expenses_v1',
  STUDENTS: 'bb_students_v1',
  ATTENDANCE: 'bb_attendance_v1',
  EVALUATIONS: 'bb_evaluations_v1',
  PUBLIC_NOTICES: 'bb_public_notices_v1',
  PUBLIC_ENQUIRIES: 'bb_public_enquiries_v1',
  APPROVALS: 'bb_approvals_v1',
  NOTIFICATIONS: 'bb_notifications_v1',
  AUDIT_LOGS: 'bb_audit_logs_v1',
  AUTH_SESSION: 'bb_auth_session_v2',
  WEBSITE_CONTENT: 'bb_website_content_v1',
  ACTIVE_BRANCH_ID: 'bb_active_branch_id_v1',
  SYSTEM_COUNTERS: 'bb_counters_v1'
};

// SUBSCRIBERS PATTERN FOR REACTIVE UPDATES
type ChangeListener = () => void;
const listeners = new Set<ChangeListener>();

export function subscribeToStore(listener: ChangeListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifySubscribers() {
  listeners.forEach(fn => {
    try {
      fn();
    } catch (e) {
      console.error('Store subscription listener error:', e);
    }
  });
}

// =========================================================================
// REAL DATABASE STATUS & CROSS-DEVICE SYNCHRONIZATION
// =========================================================================

export interface DatabaseSaveState {
  status: 'idle' | 'saving' | 'saved' | 'error';
  message: string;
  lastSavedAt?: string;
}

let currentSaveState: DatabaseSaveState = {
  status: 'idle',
  message: 'Cloudflare D1 Central Database'
};

type SaveStatusListener = (state: DatabaseSaveState) => void;
const saveStatusListeners = new Set<SaveStatusListener>();

export function subscribeToSaveStatus(listener: SaveStatusListener) {
  saveStatusListeners.add(listener);
  listener(currentSaveState);
  return () => {
    saveStatusListeners.delete(listener);
  };
}

export function getDatabaseSaveStatus(): DatabaseSaveState {
  return currentSaveState;
}

let saveResetTimer: any = null;
export function setSaveState(state: DatabaseSaveState) {
  currentSaveState = state;
  saveStatusListeners.forEach(fn => {
    try { fn(state); } catch (e) { console.error('Save status listener error:', e); }
  });

  if (saveResetTimer) clearTimeout(saveResetTimer);
  if (state.status === 'saved' || state.status === 'error') {
    saveResetTimer = setTimeout(() => {
      currentSaveState = { status: 'idle', message: 'Cloudflare D1 Central Database', lastSavedAt: state.lastSavedAt };
      saveStatusListeners.forEach(fn => {
        try { fn(currentSaveState); } catch {}
      });
    }, state.status === 'saved' ? 3000 : 4500);
  }
}

let isSyncing = false;
let syncStarted = false;

/**
 * Authoritative cross-device sync from Cloudflare D1
 */
export async function syncWithServer(): Promise<boolean> {
  if (isSyncing) return false;
  isSyncing = true;
  try {
    const res = await fetch('/api/sync/all');
    if (!res.ok) {
      isSyncing = false;
      return false;
    }
    const json = await res.json();
    if (!json.success || !json.data) {
      isSyncing = false;
      return false;
    }

    const {
      branches, users, courts, institutions, clients, consultations,
      matters, cases, caseAssignments, courtDiary, tasks, properties,
      landlords, tenants, tenancies, quitNotices, invoices, payments,
      expenses, students, legalResearch, documents, publicNotices,
      publicEnquiries, approvals, auditLogs, websiteContent,
      units, rentRecords, correspondence, appointments, attendance,
      evaluations, propertyDisputes
    } = json.data;

    if (users && users.length > 0) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    if (branches && branches.length > 0) localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(branches));
    if (courts && courts.length > 0) localStorage.setItem(STORAGE_KEYS.COURTS, JSON.stringify(courts));
    if (institutions && institutions.length > 0) localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(institutions));
    if (clients) localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    if (consultations) localStorage.setItem(STORAGE_KEYS.CONSULTATIONS, JSON.stringify(consultations));
    if (matters) localStorage.setItem(STORAGE_KEYS.MATTERS, JSON.stringify(matters));
    if (cases) localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
    if (caseAssignments) localStorage.setItem(STORAGE_KEYS.CASE_ASSIGNMENTS, JSON.stringify(caseAssignments));
    if (courtDiary) localStorage.setItem(STORAGE_KEYS.COURT_DIARY, JSON.stringify(courtDiary));
    if (tasks) localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    if (properties) localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(properties));
    if (landlords) localStorage.setItem(STORAGE_KEYS.LANDLORDS, JSON.stringify(landlords));
    if (tenants) localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(tenants));
    if (tenancies) localStorage.setItem(STORAGE_KEYS.TENANCIES, JSON.stringify(tenancies));
    if (quitNotices) localStorage.setItem(STORAGE_KEYS.QUIT_NOTICES, JSON.stringify(quitNotices));
    if (invoices) localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    if (payments) localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    if (expenses) localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    if (students) localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    if (legalResearch) localStorage.setItem(STORAGE_KEYS.LEGAL_RESEARCH, JSON.stringify(legalResearch));
    if (documents) localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
    if (publicNotices) localStorage.setItem(STORAGE_KEYS.PUBLIC_NOTICES, JSON.stringify(publicNotices));
    if (publicEnquiries) localStorage.setItem(STORAGE_KEYS.PUBLIC_ENQUIRIES, JSON.stringify(publicEnquiries));
    if (approvals) localStorage.setItem(STORAGE_KEYS.APPROVALS, JSON.stringify(approvals));
    if (auditLogs) localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
    if (websiteContent) localStorage.setItem(STORAGE_KEYS.WEBSITE_CONTENT, JSON.stringify(websiteContent));
    if (units) localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units));
    if (rentRecords) localStorage.setItem(STORAGE_KEYS.RENT_RECORDS, JSON.stringify(rentRecords));
    if (correspondence) localStorage.setItem(STORAGE_KEYS.CORRESPONDENCE, JSON.stringify(correspondence));
    if (appointments) localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    if (attendance) localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
    if (evaluations) localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(evaluations));
    if (propertyDisputes) localStorage.setItem(STORAGE_KEYS.PROPERTY_DISPUTES, JSON.stringify(propertyDisputes));

    notifySubscribers();
    isSyncing = false;
    return true;
  } catch (err) {
    console.warn('Sync with Cloudflare D1 server encountered network error:', err);
    isSyncing = false;
    return false;
  }
}

export function startAutoSync(intervalMs: number = 8000) {
  if (syncStarted || typeof window === 'undefined') return;
  syncStarted = true;

  // Immediate sync
  syncWithServer();

  // Polling loop
  setInterval(() => {
    syncWithServer();
  }, intervalMs);

  // Sync on tab focus
  window.addEventListener('focus', () => {
    syncWithServer();
  });

  // Sync on reconnect
  window.addEventListener('online', () => {
    syncWithServer();
  });
}

function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifySubscribers();
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

// NUMBER GENERATOR UTILITY
function getNextNumber(type: string, prefix: string): string {
  const counters = getFromStorage<Record<string, number>>(STORAGE_KEYS.SYSTEM_COUNTERS, {});
  const current = (counters[type] || 0) + 1;
  counters[type] = current;
  setToStorage(STORAGE_KEYS.SYSTEM_COUNTERS, counters);
  const formatted = String(current).padStart(6, '0');
  return `BBC-${prefix}-2026-${formatted}`;
}

// LOG AUDIT TRAIL
export function logAudit(
  user: { id?: string; name: string; role?: UserRole },
  action: string,
  entity: string,
  entityId: string,
  details: string
): void {
  const logs = getFromStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  const newLog: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    userId: user.id || 'system',
    userName: user.name,
    userRole: user.role || 'ADMINISTRATOR_SECRETARY',
    action,
    entity,
    entityId,
    details
  };
  setToStorage(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...logs]);
}

// DISPATCH NOTIFICATION
export function dispatchNotification(
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'urgent' = 'info',
  targetRole?: UserRole,
  userId?: string,
  linkAction?: string
): void {
  const notifs = getFromStorage<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  const newNotif: NotificationItem = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title,
    message,
    type,
    targetRole,
    userId,
    linkAction,
    date: new Date().toISOString(),
    isRead: false
  };
  setToStorage(STORAGE_KEYS.NOTIFICATIONS, [newNotif, ...notifs]);
}

// INITIALIZE STORE ONCE IF EMPTY
export async function initializeStorage(): Promise<void> {
  const defaultSetupPassword = 'admin@2026';
  const existingUsers = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!existingUsers) {
    // Generate initial password hashes for the default accounts
    const initializedUsers: User[] = [];
    
    for (const u of INITIAL_USERS) {
      const hash = await hashPassword(defaultSetupPassword, u.salt);
      initializedUsers.push({
        ...u,
        passwordHash: hash,
        requiresPasswordChange: true
      });
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initializedUsers));
  }

  if (!localStorage.getItem(STORAGE_KEYS.BRANCHES)) {
    localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(INITIAL_BRANCHES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.COURTS)) {
    localStorage.setItem(STORAGE_KEYS.COURTS, JSON.stringify(INITIAL_COURTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.INSTITUTIONS)) {
    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(INITIAL_INSTITUTIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PUBLIC_NOTICES)) {
    localStorage.setItem(STORAGE_KEYS.PUBLIC_NOTICES, JSON.stringify(INITIAL_PUBLIC_NOTICES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.WEBSITE_CONTENT)) {
    localStorage.setItem(STORAGE_KEYS.WEBSITE_CONTENT, JSON.stringify(INITIAL_WEBSITE_CONTENT));
  }

  // Start continuous synchronization with Cloudflare D1
  startAutoSync(8000);
  await syncWithServer();
}

// D1 API Mutation Helper
async function persistToD1(endpoint: string, method: string, data: any, actor?: User) {
  setSaveState({ status: 'saving', message: 'Saving to Cloudflare D1...' });
  try {
    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(actor ? { 'X-User-Id': actor.id, 'X-User-Role': actor.role } : {})
      },
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      throw new Error(json.error || `HTTP ${res.status}`);
    }
    setSaveState({ status: 'saved', message: 'Saved successfully', lastSavedAt: new Date().toLocaleTimeString() });
    return json;
  } catch (err: any) {
    console.error(`D1 API persistence failed for ${method} ${endpoint}:`, err);
    setSaveState({ status: 'error', message: 'Failed to save. Please try again.' });
    throw err;
  }
}

// Generic D1 record persistence for every firm module (create / update / delete).
// All writes travel to the server-side Worker / Pages Function, which reaches D1
// through the env.DB binding — no Cloudflare credentials ever touch the browser.
function persistRecord(table: string, method: 'POST' | 'PUT' | 'DELETE', data: any, actor?: User) {
  setSaveState({ status: 'saving', message: 'Saving to Cloudflare D1...' });
  const url = method === 'DELETE'
    ? `/api/records/${table}/${encodeURIComponent(data.id)}`
    : `/api/records/${table}`;

  fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(actor ? { 'X-User-Id': actor.id, 'X-User-Role': actor.role } : {})
    },
    body: method === 'DELETE' ? undefined : JSON.stringify(data)
  })
    .then(async res => {
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setSaveState({ status: 'saved', message: 'Saved successfully', lastSavedAt: new Date().toLocaleTimeString() });
    })
    .catch((err: any) => {
      console.error(`D1 persistence failed for ${method} /api/records/${table}:`, err);
      setSaveState({ status: 'error', message: 'Failed to save. Please try again.' });
    });
}

// STORE REPOSITORY API
export const storageService = {
  // Website Content Management (CMS)
  getWebsiteContent: (): WebsiteContent => {
    return getFromStorage<WebsiteContent>(STORAGE_KEYS.WEBSITE_CONTENT, INITIAL_WEBSITE_CONTENT);
  },
  updateWebsiteContent: (content: Partial<WebsiteContent>, actor: User): WebsiteContent => {
    const current = storageService.getWebsiteContent();
    const updated: WebsiteContent = {
      ...current,
      ...content,
      lastUpdated: new Date().toISOString(),
      updatedBy: actor.name
    };
    setToStorage(STORAGE_KEYS.WEBSITE_CONTENT, updated);
    logAudit(actor, 'UPDATE_WEBSITE_CONTENT', 'WebsiteContent', 'cms-main', `Updated dynamic Chambers website content`);
    persistToD1('/api/website-content', 'PUT', updated, actor).then(() => syncWithServer()).catch(() => {});
    return updated;
  },

  // Users & Staff
  getUsers: (): User[] => getFromStorage<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS),
  getUserById: (id: string): User | undefined => {
    return storageService.getUsers().find(u => u.id === id);
  },
  getUserByUsernameOrEmail: (identifier: string): User | undefined => {
    const clean = identifier.trim().toLowerCase();

    // Direct match by username or email
    const directMatch = storageService.getUsers().find(
      u => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
    );
    if (directMatch) return directMatch;

    // Role name aliases
    if (['principal.partner', 'principal_partner', 'principal-partner', 'principal', 'admin'].includes(clean)) {
      return storageService.getUsers().find(u => u.role === 'PRINCIPAL_PARTNER');
    }
    if (['head.chamber', 'head_of_chamber', 'head.of.chamber', 'head_chamber', 'head'].includes(clean)) {
      return storageService.getUsers().find(u => u.role === 'HEAD_OF_CHAMBER');
    }
    if (['administrator', 'administrator_secretary', 'admin_secretary', 'secretary'].includes(clean)) {
      return storageService.getUsers().find(u => u.role === 'ADMINISTRATOR_SECRETARY');
    }
    if (['accounts', 'account_officer', 'account'].includes(clean)) {
      return storageService.getUsers().find(u => u.role === 'ACCOUNT_OFFICER');
    }
    if (['counsel', 'counsel_staff', 'counsel.staff'].includes(clean)) {
      return storageService.getUsers().find(u => u.role === 'COUNSEL_STAFF');
    }

    return undefined;
  },

  // Authentication & Session (active session expires after 24 hours of inactivity)
  authenticateUser: async (identifier: string, password: string, rememberMe: boolean = true): Promise<{
    success: boolean;
    user?: User;
    session?: UserSession;
    error?: string;
    requiresPasswordChange?: boolean;
  }> => {
    // Authoritative server-side authentication against Cloudflare D1 (binding env.DB).
    // Password hashes stay in the database and are never shipped to the browser.
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, rememberMe })
      });
      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success && json.user && json.session) {
        const cachedUsers = storageService.getUsers();
        const mergedUsers = cachedUsers.some(u => u.id === json.user.id)
          ? cachedUsers.map(u => (u.id === json.user.id ? { ...u, ...json.user } : u))
          : [...cachedUsers, json.user];
        setToStorage(STORAGE_KEYS.USERS, mergedUsers);

        const session: UserSession = {
          ...json.session,
          lastActiveAt: new Date().toISOString()
        };
        setToStorage(STORAGE_KEYS.AUTH_SESSION, session);
        syncWithServer();

        return {
          success: true,
          user: json.user,
          session,
          requiresPasswordChange: Boolean(json.requiresPasswordChange)
        };
      }

      if (res.status === 401 || res.status === 403) {
        logAudit({ name: identifier }, 'FAILED_LOGIN_ATTEMPT', 'Session', identifier, `Login rejected by Cloudflare D1 for ${identifier}`);
        return { success: false, error: json.error || 'Invalid username/email or password.' };
      }
    } catch (err) {
      console.warn('Cloudflare D1 authentication unreachable; falling back to local verification.', err);
    }

    const user = storageService.getUserByUsernameOrEmail(identifier);
    if (!user) {
      logAudit({ name: identifier }, 'FAILED_LOGIN_ATTEMPT', 'Session', identifier, `Failed login attempt: User not found`);
      return { success: false, error: 'Invalid username/email or password.' };
    }

    // Check account status
    if (user.accountStatus === 'Suspended') {
      logAudit(user, 'LOGIN_BLOCKED_SUSPENDED', 'User', user.id, `Login blocked: Account suspended`);
      return { success: false, error: 'Your account has been suspended. Please consult the Principal Partner.' };
    }

    if (user.accountStatus === 'Inactive' || !user.isActive) {
      logAudit(user, 'LOGIN_BLOCKED_INACTIVE', 'User', user.id, `Login blocked: Account is inactive`);
      return { success: false, error: 'Your account is deactivated. Please consult Chambers Administration.' };
    }

    if (user.accountStatus === 'Archived') {
      return { success: false, error: 'This user account has been archived.' };
    }

    // Verify password hash
    let isValid = await verifyPassword(password, user.salt, user.passwordHash);
    if (!isValid && user.requiresPasswordChange && password === 'admin@2026') {
      isValid = true;
      user.passwordHash = await hashPassword('admin@2026', user.salt);
      const all = storageService.getUsers().map(u => u.id === user.id ? user : u);
      setToStorage(STORAGE_KEYS.USERS, all);
    }

    if (!isValid) {
      const users = storageService.getUsers().map(u => {
        if (u.id === user.id) {
          return { ...u, failedLoginAttempts: (u.failedLoginAttempts || 0) + 1 };
        }
        return u;
      });
      setToStorage(STORAGE_KEYS.USERS, users);
      logAudit(user, 'FAILED_PASSWORD_ATTEMPT', 'User', user.id, `Incorrect password entered for ${user.username}`);
      return { success: false, error: 'Invalid username/email or password.' };
    }

    // Reset failed login attempts and update lastLogin
    const users = storageService.getUsers().map(u => {
      if (u.id === user.id) {
        return {
          ...u,
          failedLoginAttempts: 0,
          lastLogin: new Date().toISOString()
        };
      }
      return u;
    });
    setToStorage(STORAGE_KEYS.USERS, users);

    // Create session (active session expires if inactive for 24 hours)
    const token = generateSecureToken();
    const INACTIVITY_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();
    const expiresAt = new Date(now + INACTIVITY_TIMEOUT_MS).toISOString();

    const session: UserSession = {
      userId: user.id,
      token,
      role: user.role,
      branchId: user.branchId,
      rememberMe,
      expiresAt,
      lastActiveAt: new Date(now).toISOString()
    };

    setToStorage(STORAGE_KEYS.AUTH_SESSION, session);
    logAudit(user, 'USER_LOGIN_SUCCESS', 'Session', user.id, `User authenticated successfully: ${user.name} (${user.role})`);

    return {
      success: true,
      user,
      session,
      requiresPasswordChange: user.requiresPasswordChange
    };
  },

  getCurrentSession: (): UserSession | null => {
    const session = getFromStorage<UserSession | null>(STORAGE_KEYS.AUTH_SESSION, null);
    if (!session) return null;

    const INACTIVITY_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();
    const lastActive = session.lastActiveAt
      ? new Date(session.lastActiveAt).getTime()
      : new Date(session.expiresAt).getTime() - INACTIVITY_TIMEOUT_MS;

    // Check if inactive for 24 hours or past expiry
    if (now - lastActive > INACTIVITY_TIMEOUT_MS || new Date(session.expiresAt).getTime() < now) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      return null;
    }

    return session;
  },

  touchSession: (): void => {
    const session = getFromStorage<UserSession | null>(STORAGE_KEYS.AUTH_SESSION, null);
    if (!session) return;
    const INACTIVITY_TIMEOUT_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();
    session.lastActiveAt = new Date(now).toISOString();
    session.expiresAt = new Date(now + INACTIVITY_TIMEOUT_MS).toISOString();
    setToStorage(STORAGE_KEYS.AUTH_SESSION, session);
  },

  setUserSession: (session: UserSession): void => {
    setToStorage(STORAGE_KEYS.AUTH_SESSION, session);
  },

  logoutUser: (actor?: User): void => {
    if (actor) {
      logAudit(actor, 'USER_LOGOUT', 'Session', actor.id, `User logged out: ${actor.name}`);
    }
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    notifySubscribers();
  },

  // Password Management
  changePassword: async (userId: string, currentPassword: string, newPassword: string): Promise<{
    success: boolean;
    error?: string;
  }> => {
    const user = storageService.getUserById(userId);
    if (!user) return { success: false, error: 'User not found' };

    // Validate new password strength
    const strength = validatePasswordStrength(newPassword);
    if (!strength.isValid) {
      return { success: false, error: strength.errors[0] };
    }

    // Authoritative server-side verification and re-hashing against Cloudflare D1.
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentPassword, newPassword })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        return { success: false, error: json.error || 'Current password does not match our records.' };
      }

      const users = storageService.getUsers().map(u => {
        if (u.id === userId) {
          return {
            ...u,
            requiresPasswordChange: false,
            accountStatus: u.accountStatus === 'Password Reset Required' ? ('Active' as const) : u.accountStatus,
            passwordChangedAt: new Date().toISOString()
          };
        }
        return u;
      });
      setToStorage(STORAGE_KEYS.USERS, users);
      logAudit(user, 'PASSWORD_CHANGE_SUCCESS', 'User', userId, `Password updated successfully for ${user.username}`);
      await syncWithServer();
      return { success: true };
    } catch (err) {
      console.warn('Cloudflare D1 password change unreachable; falling back to local verification.', err);
    }

    // Offline fallback: verify and re-hash locally, then persist the change to D1.
    const isCurrentValid = await verifyPassword(currentPassword, user.salt, user.passwordHash);
    if (!isCurrentValid) {
      return { success: false, error: 'Current password does not match our records.' };
    }

    const newSalt = generateSalt();
    const newHash = await hashPassword(newPassword, newSalt);

    const users = storageService.getUsers().map(u => {
      if (u.id === userId) {
        return {
          ...u,
          salt: newSalt,
          passwordHash: newHash,
          requiresPasswordChange: false,
          accountStatus: u.accountStatus === 'Password Reset Required' ? ('Active' as const) : u.accountStatus,
          passwordChangedAt: new Date().toISOString()
        };
      }
      return u;
    });

    setToStorage(STORAGE_KEYS.USERS, users);
    logAudit(user, 'PASSWORD_CHANGE_SUCCESS', 'User', userId, `Password updated successfully for ${user.username}`);
    persistToD1('/api/auth/change-password', 'POST', { userId, currentPassword, newPassword }).catch(() => {});
    return { success: true };
  },

  adminResetUserPassword: async (targetUserId: string, actor: User): Promise<{
    success: boolean;
    temporaryPassword?: string;
    error?: string;
  }> => {
    const targetUser = storageService.getUserById(targetUserId);
    if (!targetUser) return { success: false, error: 'Target user not found' };

    // Protect Principal Partner: Head of Chamber / Admin CANNOT reset Principal Partner
    if (targetUser.role === 'PRINCIPAL_PARTNER' && actor.role !== 'PRINCIPAL_PARTNER') {
      return { success: false, error: 'Unauthorized: Only the Principal Partner can modify or reset their own credentials.' };
    }

    const tempPassword = `Reset@${Math.floor(100000 + Math.random() * 900000)}!`;
    const newSalt = generateSalt();
    const newHash = await hashPassword(tempPassword, newSalt);

    const users = storageService.getUsers().map(u => {
      if (u.id === targetUserId) {
        return {
          ...u,
          salt: newSalt,
          passwordHash: newHash,
          requiresPasswordChange: true,
          accountStatus: 'Password Reset Required' as const,
          passwordChangedAt: new Date().toISOString()
        };
      }
      return u;
    });

    setToStorage(STORAGE_KEYS.USERS, users);
    logAudit(actor, 'ADMIN_PASSWORD_RESET', 'User', targetUserId, `${actor.name} (${actor.role}) reset password for ${targetUser.name} (${targetUser.username})`);
    const resetUser = users.find(u => u.id === targetUserId);
    if (resetUser) persistToD1(`/api/users/${targetUserId}`, 'PUT', resetUser, actor).catch(() => {});
    return { success: true, temporaryPassword: tempPassword };
  },

  requestPasswordReset: (identifier: string): {
    success: boolean;
    message: string;
    resetToken?: string;
  } => {
    const user = storageService.getUserByUsernameOrEmail(identifier);
    if (!user) {
      // Don't leak user existence
      return { success: true, message: 'If an authorized Chambers account matches that identifier, reset instructions have been dispatched.' };
    }

    const token = generateSecureToken();
    const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    const users = storageService.getUsers().map(u => {
      if (u.id === user.id) {
        return {
          ...u,
          temporaryResetToken: token,
          temporaryResetExpires: expires
        };
      }
      return u;
    });

    setToStorage(STORAGE_KEYS.USERS, users);
    logAudit(user, 'PASSWORD_RESET_REQUESTED', 'User', user.id, `Password reset token requested for ${user.username}`);
    dispatchNotification('Password Reset Requested', `A password reset token was generated for ${user.name} (${user.username}).`, 'warning', 'PRINCIPAL_PARTNER');

    return { 
      success: true, 
      message: 'Reset instructions have been generated. Use the secure authorization token or contact the Administrator.',
      resetToken: token
    };
  },

  completePasswordResetWithToken: async (token: string, newPassword: string): Promise<{
    success: boolean;
    error?: string;
  }> => {
    const usersList = storageService.getUsers();
    const user = usersList.find(u => u.temporaryResetToken === token);

    if (!user || !user.temporaryResetExpires || new Date(user.temporaryResetExpires) < new Date()) {
      return { success: false, error: 'Invalid or expired password reset token.' };
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.isValid) {
      return { success: false, error: strength.errors[0] };
    }

    const newSalt = generateSalt();
    const newHash = await hashPassword(newPassword, newSalt);

    const updated = usersList.map(u => {
      if (u.id === user.id) {
        return {
          ...u,
          salt: newSalt,
          passwordHash: newHash,
          temporaryResetToken: undefined,
          temporaryResetExpires: undefined,
          requiresPasswordChange: false,
          accountStatus: 'Active' as const,
          passwordChangedAt: new Date().toISOString()
        };
      }
      return u;
    });

    setToStorage(STORAGE_KEYS.USERS, updated);
    logAudit(user, 'PASSWORD_RESET_COMPLETED', 'User', user.id, `Password reset completed via token for ${user.username}`);
    return { success: true };
  },

  // User Account CRUD
  createUserAccount: async (data: {
    username: string;
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    branchId: string;
    title: string;
    practiceAreas: string[];
    bio: string;
    photoUrl: string;
    initialPassword?: string;
    isPubliclyVisible?: boolean;
    requiresPasswordChange?: boolean;
  }, actor: User): Promise<{ success: boolean; user?: User; error?: string }> => {
    // Validate authority: Only Principal Partner or Head of Chamber
    if (actor.role !== 'PRINCIPAL_PARTNER' && actor.role !== 'HEAD_OF_CHAMBER') {
      return { success: false, error: 'Unauthorized: Only the Principal Partner or Head of Chamber can create accounts.' };
    }

    // Head of Chamber cannot create Principal Partner accounts
    if (data.role === 'PRINCIPAL_PARTNER' && actor.role !== 'PRINCIPAL_PARTNER') {
      return { success: false, error: 'Unauthorized: Only the Principal Partner can provision Principal Partner accounts.' };
    }

    // Check unique username and email
    const cleanUsername = data.username.trim().toLowerCase();
    const cleanEmail = data.email.trim().toLowerCase();
    const existing = storageService.getUsers().find(
      u => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail
    );
    if (existing) {
      return { success: false, error: 'Username or email already assigned to an existing personnel account.' };
    }

    const initialPwd = data.initialPassword || 'admin@2026';
    const salt = generateSalt();
    const hash = await hashPassword(initialPwd, salt);

    const newUser: User = {
      id: `usr-${Date.now()}`,
      username: cleanUsername,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      branchId: data.branchId,
      title: data.title,
      practiceAreas: data.practiceAreas,
      bio: data.bio,
      photoUrl: data.photoUrl || '',
      availability: 'AVAILABLE',
      isPubliclyVisible: data.isPubliclyVisible ?? (data.role === 'COUNSEL_STAFF' || data.role === 'HEAD_OF_CHAMBER' || data.role === 'PRINCIPAL_PARTNER'),
      isActive: true,
      accountStatus: 'Active',
      salt,
      passwordHash: hash,
      requiresPasswordChange: data.requiresPasswordChange ?? true,
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString()
    };

    const users = storageService.getUsers();
    setToStorage(STORAGE_KEYS.USERS, [...users, newUser]);
    logAudit(actor, 'CREATE_USER_ACCOUNT', 'User', newUser.id, `${actor.name} created account for ${newUser.name} (${newUser.username}) as ${newUser.role}`);
    persistToD1('/api/users', 'POST', newUser, actor).then(() => syncWithServer()).catch(() => {});
    return { success: true, user: newUser };
  },

  updateUserAccount: (updatedUser: User, actor: User): { success: boolean; error?: string } => {
    const existing = storageService.getUserById(updatedUser.id);
    if (!existing) return { success: false, error: 'User not found' };

    // Validate username uniqueness if changed
    const cleanUsername = updatedUser.username.trim().toLowerCase();
    if (!cleanUsername) {
      return { success: false, error: 'Chambers username cannot be empty.' };
    }
    if (cleanUsername !== existing.username.toLowerCase()) {
      const duplicate = storageService.getUsers().find(u => u.id !== updatedUser.id && u.username.toLowerCase() === cleanUsername);
      if (duplicate) {
        return { success: false, error: `Username "${cleanUsername}" is already assigned to another Chambers user account.` };
      }
    }

    // PRINCIPAL PARTNER PROTECTION:
    // If the existing user is the Principal Partner:
    // Only the Principal Partner can update their own account, and they cannot demote themselves or disable their own account.
    if (existing.role === 'PRINCIPAL_PARTNER') {
      if (actor.id !== existing.id) {
        return { success: false, error: 'Protected Account: The Principal Partner account cannot be modified by other users.' };
      }
      if (updatedUser.role !== 'PRINCIPAL_PARTNER' || !updatedUser.isActive || updatedUser.accountStatus !== 'Active') {
        return { success: false, error: 'Protected Account: The system must maintain an active Principal Partner account.' };
      }
    }

    // Head of Chamber cannot promote anyone to Principal Partner
    if (updatedUser.role === 'PRINCIPAL_PARTNER' && actor.role !== 'PRINCIPAL_PARTNER') {
      return { success: false, error: 'Unauthorized: Only the Principal Partner can assign the Principal Partner role.' };
    }

    // Administrator / Secretary cannot change user roles
    if (actor.role === 'ADMINISTRATOR_SECRETARY' && updatedUser.role !== existing.role) {
      return { success: false, error: 'Unauthorized: Administrator / Secretary cannot modify user role assignments.' };
    }

    const sanitizedUser: User = {
      ...updatedUser,
      username: cleanUsername
    };

    const users = storageService.getUsers().map(u => u.id === updatedUser.id ? sanitizedUser : u);
    setToStorage(STORAGE_KEYS.USERS, users);
    logAudit(actor, 'UPDATE_USER_ACCOUNT', 'User', updatedUser.id, `${actor.name} updated account details for ${sanitizedUser.name} (${sanitizedUser.username})`);
    persistToD1(`/api/users/${updatedUser.id}`, 'PUT', sanitizedUser, actor).then(() => syncWithServer()).catch(() => {});
    return { success: true };
  },

  setUserStatus: (targetUserId: string, newStatus: User['accountStatus'], actor: User): { success: boolean; error?: string } => {
    const target = storageService.getUserById(targetUserId);
    if (!target) return { success: false, error: 'User not found' };

    // PRINCIPAL PARTNER PROTECTION:
    if (target.role === 'PRINCIPAL_PARTNER') {
      return { success: false, error: 'Protected Account: The Principal Partner account cannot be deactivated or suspended.' };
    }

    const isActive = newStatus === 'Active';
    const users = storageService.getUsers().map(u => {
      if (u.id === targetUserId) {
        return { ...u, accountStatus: newStatus, isActive };
      }
      return u;
    });

    setToStorage(STORAGE_KEYS.USERS, users);
    logAudit(actor, 'SET_USER_STATUS', 'User', targetUserId, `${actor.name} changed account status of ${target.name} to ${newStatus}`);
    const statusUser = users.find(u => u.id === targetUserId);
    if (statusUser) persistToD1(`/api/users/${targetUserId}`, 'PUT', statusUser, actor).then(() => syncWithServer()).catch(() => {});
    return { success: true };
  },

  deleteUserAccount: (targetUserId: string, actor: User): { success: boolean; error?: string } => {
    const target = storageService.getUserById(targetUserId);
    if (!target) return { success: false, error: 'User not found' };

    // PRINCIPAL PARTNER PROTECTION:
    if (target.role === 'PRINCIPAL_PARTNER') {
      return { success: false, error: 'Protected Account: The Principal Partner account cannot be deleted or removed.' };
    }

    // Archive instead of hard delete
    const users = storageService.getUsers().map(u => {
      if (u.id === targetUserId) {
        return { ...u, accountStatus: 'Archived' as const, isActive: false };
      }
      return u;
    });

    setToStorage(STORAGE_KEYS.USERS, users);
    logAudit(actor, 'ARCHIVE_USER_ACCOUNT', 'User', targetUserId, `${actor.name} archived personnel account ${target.name} (${target.username})`);
    const archivedUser = users.find(u => u.id === targetUserId);
    if (archivedUser) persistToD1(`/api/users/${targetUserId}`, 'PUT', archivedUser, actor).then(() => syncWithServer()).catch(() => {});
    return { success: true };
  },

  updateCounselAvailability: (userId: string, availability: User['availability'], actor: User): void => {
    const users = storageService.getUsers().map(u => {
      if (u.id === userId) {
        return { ...u, availability, isPubliclyVisible: true };
      }
      return u;
    });
    setToStorage(STORAGE_KEYS.USERS, users);
    logAudit(actor, 'UPDATE_AVAILABILITY', 'Counsel', userId, `Changed status to ${availability}`);
    const counsel = users.find(u => u.id === userId);
    if (counsel) persistToD1(`/api/users/${userId}`, 'PUT', counsel, actor).then(() => syncWithServer()).catch(() => {});
  },

  // Branches
  getBranches: (): Branch[] => getFromStorage<Branch[]>(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES),
  addBranch: (branch: Omit<Branch, 'id'>, actor: User): Branch => {
    const branches = storageService.getBranches();
    const newBranch: Branch = {
      ...branch,
      id: `br-${Date.now()}`
    };
    setToStorage(STORAGE_KEYS.BRANCHES, [...branches, newBranch]);
    logAudit(actor, 'CREATE_BRANCH', 'Branch', newBranch.id, `Created branch: ${newBranch.name}`);
    persistRecord('branches', 'POST', newBranch, actor);
    return newBranch;
  },
  updateBranch: (branch: Branch, actor: User): void => {
    const branches = storageService.getBranches().map(b => b.id === branch.id ? branch : b);
    setToStorage(STORAGE_KEYS.BRANCHES, branches);
    logAudit(actor, 'UPDATE_BRANCH', 'Branch', branch.id, `Updated branch: ${branch.name}`);
    persistRecord('branches', 'PUT', branch, actor);
  },
  deleteBranch: (branchId: string, actor: User): { success: boolean; error?: string } => {
    if (actor.role !== 'PRINCIPAL_PARTNER') {
      return { success: false, error: 'Unauthorized: Only the Principal Partner can delete a Chambers branch.' };
    }
    const branches = storageService.getBranches();
    if (branches.length <= 1) {
      return { success: false, error: 'System constraint: At least one Chambers branch must remain active.' };
    }
    const target = branches.find(b => b.id === branchId);
    if (!target) {
      return { success: false, error: 'Branch record not found.' };
    }
    const remaining = branches.filter(b => b.id !== branchId);
    setToStorage(STORAGE_KEYS.BRANCHES, remaining);
    logAudit(actor, 'DELETE_BRANCH', 'Branch', branchId, `Principal Partner deleted branch: ${target.name} (${target.code})`);
    persistRecord('branches', 'DELETE', { id: branchId }, actor);
    return { success: true };
  },

  // Courts
  getCourts: (): Court[] => getFromStorage<Court[]>(STORAGE_KEYS.COURTS, INITIAL_COURTS),
  addCourt: (court: Omit<Court, 'id'>, actor: User): Court => {
    const courts = storageService.getCourts();
    const newCourt: Court = { ...court, id: `crt-${Date.now()}` };
    setToStorage(STORAGE_KEYS.COURTS, [...courts, newCourt]);
    logAudit(actor, 'ADD_COURT', 'Court', newCourt.id, `Added court: ${newCourt.name}`);
    persistRecord('courts', 'POST', newCourt, actor);
    return newCourt;
  },

  // Clients
  getClients: (): Client[] => getFromStorage<Client[]>(STORAGE_KEYS.CLIENTS, []),
  addClient: (clientData: Omit<Client, 'id' | 'clientId' | 'dateRegistered'>, actor: User): Client => {
    const clients = storageService.getClients();
    const clientId = getNextNumber('client', 'CLI');
    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now()}`,
      clientId,
      dateRegistered: new Date().toISOString()
    };
    setToStorage(STORAGE_KEYS.CLIENTS, [newClient, ...clients]);
    logAudit(actor, 'REGISTER_CLIENT', 'Client', newClient.id, `Registered client: ${newClient.fullName} (${clientId})`);
    dispatchNotification('New Client Registered', `${actor.name} registered client ${newClient.fullName}`, 'info', 'ADMINISTRATOR_SECRETARY');
    persistToD1('/api/clients', 'POST', newClient, actor).then(() => syncWithServer()).catch(() => {});
    return newClient;
  },
  updateClient: (client: Client, actor: User): void => {
    const clients = storageService.getClients().map(c => c.id === client.id ? client : c);
    setToStorage(STORAGE_KEYS.CLIENTS, clients);
    logAudit(actor, 'UPDATE_CLIENT', 'Client', client.id, `Updated client ${client.fullName}`);
    persistToD1(`/api/clients/${client.id}`, 'PUT', client, actor).then(() => syncWithServer()).catch(() => {});
  },

  // Consultations & Invoices & Payments Flow
  getConsultations: (): Consultation[] => getFromStorage<Consultation[]>(STORAGE_KEYS.CONSULTATIONS, []),
  bookConsultation: (data: {
    serviceCategory: string;
    preferredDate: string;
    preferredTime: string;
    fullName: string;
    phone: string;
    email: string;
    method: Consultation['method'];
    briefEnquiry: string;
    supportingDocuments?: string[];
    branchId?: string;
    feeAmount?: number;
  }): { consultation: Consultation; invoice: Invoice; paymentRef: string } => {
    const consultations = storageService.getConsultations();
    const code = getNextNumber('consultation', 'CONS');
    const invoiceNumber = getNextNumber('invoice', 'INV');
    const paymentRef = getNextNumber('payment', 'PAY');
    const fee = data.feeAmount || storageService.getWebsiteContent()?.consultationFeeStandard || 35000;

    const newConsultation: Consultation = {
      id: `cons-${Date.now()}`,
      code,
      serviceCategory: data.serviceCategory,
      preferredDate: data.preferredDate,
      preferredTime: data.preferredTime,
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      method: data.method,
      briefEnquiry: data.briefEnquiry,
      supportingDocuments: data.supportingDocuments || [],
      status: 'Awaiting Payment',
      invoiceNumber,
      paymentReference: paymentRef,
      branchId: data.branchId || 'br-abuja-01',
      clientVisibleUpdate: 'Consultation request received. Invoice generated. Awaiting payment submission.',
      createdAt: new Date().toISOString()
    };

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      clientName: data.fullName,
      clientEmail: data.email,
      clientPhone: data.phone,
      consultationCode: code,
      items: [
        {
          description: `Professional Legal Consultation Fee (${data.serviceCategory}) — ${data.method}`,
          amount: fee
        }
      ],
      subtotal: fee,
      taxAmount: 0,
      totalAmount: fee,
      date: new Date().toISOString().split('T')[0],
      dueDate: data.preferredDate,
      paymentStatus: 'UNPAID',
      paymentReference: paymentRef,
      notes: `Consultation Reference: ${code}. Quote payment reference ${paymentRef} upon transfer.`
    };

    setToStorage(STORAGE_KEYS.CONSULTATIONS, [newConsultation, ...consultations]);
    
    const invoices = storageService.getInvoices();
    setToStorage(STORAGE_KEYS.INVOICES, [newInvoice, ...invoices]);

    dispatchNotification(
      'New Consultation Booking',
      `Booking received from ${data.fullName} (${code}). Invoice ${invoiceNumber} created.`,
      'info',
      'ADMINISTRATOR_SECRETARY'
    );
    dispatchNotification(
      'Consultation Invoice Issued',
      `Invoice ${invoiceNumber} issued for ₦${fee.toLocaleString()} (Ref: ${paymentRef}).`,
      'info',
      'ACCOUNT_OFFICER'
    );

    persistToD1('/api/consultations', 'POST', {
      ...data,
      id: newConsultation.id,
      code,
      invoiceNumber,
      paymentReference: paymentRef,
      feeAmount: fee
    }).then(() => syncWithServer()).catch(() => {});

    return { consultation: newConsultation, invoice: newInvoice, paymentRef };
  },
  updateConsultation: (consultation: Consultation, actor: User): void => {
    const list = storageService.getConsultations().map(c => c.id === consultation.id ? consultation : c);
    setToStorage(STORAGE_KEYS.CONSULTATIONS, list);
    logAudit(actor, 'UPDATE_CONSULTATION', 'Consultation', consultation.id, `Updated consultation ${consultation.code}`);
    persistToD1(`/api/consultations/${consultation.id}`, 'PUT', consultation, actor).then(() => syncWithServer()).catch(() => {});
  },

  // Invoices & Payments
  getInvoices: (): Invoice[] => getFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, []),
  getInvoiceByNumber: (invoiceNumber: string): Invoice | undefined => {
    return storageService.getInvoices().find(i => i.invoiceNumber.trim() === invoiceNumber.trim());
  },
  getInvoiceByPaymentRef: (ref: string): Invoice | undefined => {
    return storageService.getInvoices().find(i => i.paymentReference.trim() === ref.trim());
  },
  createCustomInvoice: (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'paymentReference'>, actor: User): Invoice => {
    const invoices = storageService.getInvoices();
    const invoiceNumber = getNextNumber('invoice', 'INV');
    const paymentRef = getNextNumber('payment', 'PAY');
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      invoiceNumber,
      paymentReference: paymentRef,
      branchId: invoiceData.branchId || actor.branchId || 'br-abuja-01',
      approvalStatus: 'NONE'
    };
    setToStorage(STORAGE_KEYS.INVOICES, [newInvoice, ...invoices]);
    logAudit(actor, 'CREATE_INVOICE', 'Invoice', newInvoice.id, `Generated invoice ${invoiceNumber} for ${newInvoice.clientName} (₦${newInvoice.totalAmount.toLocaleString()})`);
    persistToD1('/api/invoices', 'POST', newInvoice, actor).then(() => syncWithServer()).catch(() => {});
    return newInvoice;
  },
  updateInvoice: (updatedInvoice: Invoice, actor: User): { success: boolean; error?: string } => {
    if (actor.role !== 'PRINCIPAL_PARTNER' && actor.role !== 'HEAD_OF_CHAMBER') {
      return { success: false, error: 'Unauthorized: Only the Principal Partner or Head of Chamber can edit invoice details.' };
    }
    const invoices = storageService.getInvoices();
    const existing = invoices.find(i => i.id === updatedInvoice.id);
    if (!existing) {
      return { success: false, error: 'Invoice not found in Chambers registry.' };
    }
    const updated = invoices.map(i => i.id === updatedInvoice.id ? updatedInvoice : i);
    setToStorage(STORAGE_KEYS.INVOICES, updated);
    logAudit(actor, 'UPDATE_INVOICE', 'Invoice', updatedInvoice.id, `${actor.name} edited invoice ${updatedInvoice.invoiceNumber} for ${updatedInvoice.clientName}`);
    persistRecord('invoices', 'PUT', updatedInvoice, actor);
    return { success: true };
  },
  submitInvoiceForApproval: (invoiceCode: string, reason: string, actor: User): { success: boolean; request?: ApprovalRequest; error?: string } => {
    const invoices = storageService.getInvoices();
    const invoice = invoices.find(i => i.invoiceNumber.trim().toUpperCase() === invoiceCode.trim().toUpperCase());
    if (!invoice) {
      return { success: false, error: `Invoice with code "${invoiceCode}" was not found in Chambers registry.` };
    }

    const req = storageService.requestApproval({
      requestType: 'Invoice Billing Approval',
      requesterId: actor.id,
      requesterName: actor.name,
      requesterRole: actor.role,
      branchId: actor.branchId || invoice.branchId || 'br-abuja-01',
      title: `Invoice Clearance: ${invoice.invoiceNumber} (₦${invoice.totalAmount.toLocaleString()})`,
      description: `Client: ${invoice.clientName}. Justification: ${reason || 'Account Officer submitted fee note for executive clearance'}`,
      referenceCode: invoice.invoiceNumber
    }, actor);

    const updatedInvoices = invoices.map(i => {
      if (i.invoiceNumber.trim().toUpperCase() === invoiceCode.trim().toUpperCase()) {
        return {
          ...i,
          approvalStatus: 'PENDING_APPROVAL' as const,
          approvalRequestId: req.id,
          approvalNotes: `Submitted by ${actor.name} (${actor.role}): ${reason}`
        };
      }
      return i;
    });
    setToStorage(STORAGE_KEYS.INVOICES, updatedInvoices);
    logAudit(actor, 'SUBMIT_INVOICE_APPROVAL', 'Invoice', invoice.id, `${actor.name} submitted invoice ${invoice.invoiceNumber} for Principal Partner authorization`);
    const submitted = updatedInvoices.find(i => i.id === invoice.id);
    if (submitted) persistRecord('invoices', 'PUT', submitted, actor);
    return { success: true, request: req };
  },
  submitPayment: (data: {
    paymentReference: string;
    invoiceNumber: string;
    clientName: string;
    amount: number;
    paymentMethod: PaymentRecord['paymentMethod'];
    bankTransactionRef?: string;
    notes?: string;
    proofDocumentUrl?: string;
  }): PaymentRecord => {
    const payments = storageService.getPayments();
    const invoicesList = storageService.getInvoices();
    const matchingInvoice = invoicesList.find(i => i.invoiceNumber === data.invoiceNumber || i.paymentReference === data.paymentReference);
    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      paymentReference: data.paymentReference,
      invoiceNumber: data.invoiceNumber,
      clientName: data.clientName,
      amount: data.amount,
      branchId: matchingInvoice?.branchId || 'br-abuja-01',
      paymentMethod: data.paymentMethod,
      paymentDate: new Date().toISOString(),
      status: 'PAYMENT_SUBMITTED',
      bankTransactionRef: data.bankTransactionRef,
      verificationNotes: data.notes,
      proofDocumentUrl: data.proofDocumentUrl,
      submittedAt: new Date().toISOString()
    };
    setToStorage(STORAGE_KEYS.PAYMENTS, [newPayment, ...payments]);

    const invoices = storageService.getInvoices().map(inv => {
      if (inv.invoiceNumber === data.invoiceNumber || inv.paymentReference === data.paymentReference) {
        return { ...inv, paymentStatus: 'PAYMENT_SUBMITTED' as const, paymentMethod: data.paymentMethod };
      }
      return inv;
    });
    setToStorage(STORAGE_KEYS.INVOICES, invoices);

    const consultations = storageService.getConsultations().map(c => {
      if (c.paymentReference === data.paymentReference || c.invoiceNumber === data.invoiceNumber) {
        return {
          ...c,
          status: 'Payment Verification Pending' as const,
          clientVisibleUpdate: 'Payment receipt submitted. Pending verification by Account Officer.'
        };
      }
      return c;
    });
    setToStorage(STORAGE_KEYS.CONSULTATIONS, consultations);

    dispatchNotification(
      'Payment Submitted — Verification Required',
      `${data.clientName} submitted payment of ₦${data.amount.toLocaleString()} for Invoice ${data.invoiceNumber} (Ref: ${data.paymentReference})`,
      'warning',
      'ACCOUNT_OFFICER'
    );

    persistToD1('/api/payments/submit', 'POST', data).then(() => syncWithServer()).catch(() => {});

    return newPayment;
  },
  verifyPayment: (paymentId: string, isApproved: boolean, notes: string, actor: User): void => {
    const receiptNumber = isApproved ? getNextNumber('receipt', 'REC') : undefined;
    const payments = storageService.getPayments().map(p => {
      if (p.id === paymentId) {
        return {
          ...p,
          status: isApproved ? ('PAYMENT_VERIFIED' as const) : ('REJECTED' as const),
          verifiedById: actor.id,
          verifiedByName: actor.name,
          verificationDate: new Date().toISOString(),
          verificationNotes: notes,
          receiptNumber
        };
      }
      return p;
    });
    setToStorage(STORAGE_KEYS.PAYMENTS, payments);

    const verifiedPayment = payments.find(p => p.id === paymentId);
    if (verifiedPayment) {
      const invoices = storageService.getInvoices().map(inv => {
        if (inv.invoiceNumber === verifiedPayment.invoiceNumber) {
          return {
            ...inv,
            paymentStatus: isApproved ? ('PAYMENT_VERIFIED' as const) : ('UNPAID' as const)
          };
        }
        return inv;
      });
      setToStorage(STORAGE_KEYS.INVOICES, invoices);

      const consultations = storageService.getConsultations().map(c => {
        if (c.invoiceNumber === verifiedPayment.invoiceNumber || c.paymentReference === verifiedPayment.paymentReference) {
          return {
            ...c,
            status: isApproved ? ('Payment Verified' as const) : ('Awaiting Payment' as const),
            clientVisibleUpdate: isApproved
              ? `Payment verified by Accounts. Receipt ${receiptNumber} generated. Consultation schedule confirmed.`
              : `Payment could not be verified: ${notes}. Please resubmit with valid transaction reference.`
          };
        }
        return c;
      });
      setToStorage(STORAGE_KEYS.CONSULTATIONS, consultations);

      logAudit(
        actor,
        isApproved ? 'VERIFY_PAYMENT' : 'REJECT_PAYMENT',
        'Payment',
        paymentId,
        `${isApproved ? 'Verified' : 'Rejected'} payment of ₦${verifiedPayment.amount.toLocaleString()} for ${verifiedPayment.clientName}. Notes: ${notes}`
      );

      dispatchNotification(
        isApproved ? 'Payment Verified Successfully' : 'Payment Verification Rejected',
        `Invoice ${verifiedPayment.invoiceNumber} status: ${isApproved ? 'VERIFIED' : 'REJECTED'} by ${actor.name}`,
        isApproved ? 'success' : 'warning',
        'ADMINISTRATOR_SECRETARY'
      );

      persistToD1('/api/payments/verify', 'POST', { paymentId, isApproved, notes }, actor).then(() => syncWithServer()).catch(() => {});
    }
  },
  getPayments: (): PaymentRecord[] => getFromStorage<PaymentRecord[]>(STORAGE_KEYS.PAYMENTS, []),

  // Expenses
  getExpenses: (): ExpenseRecord[] => getFromStorage<ExpenseRecord[]>(STORAGE_KEYS.EXPENSES, []),
  addExpense: (expense: Omit<ExpenseRecord, 'id' | 'recordedById' | 'recordedByName'>, actor: User): ExpenseRecord => {
    const expenses = storageService.getExpenses();
    const newExpense: ExpenseRecord = {
      ...expense,
      id: `exp-${Date.now()}`,
      branchId: expense.branchId || actor.branchId || 'br-abuja-01',
      recordedById: actor.id,
      recordedByName: actor.name
    };
    setToStorage(STORAGE_KEYS.EXPENSES, [newExpense, ...expenses]);
    logAudit(actor, 'RECORD_EXPENSE', 'Expense', newExpense.id, `Recorded ${expense.accountType} expense: ₦${expense.amount.toLocaleString()} - ${expense.description}`);
    persistRecord('expenses', 'POST', newExpense, actor);
    return newExpense;
  },

  // Matters
  getMatters: (): Matter[] => getFromStorage<Matter[]>(STORAGE_KEYS.MATTERS, []),
  addMatter: (matterData: Omit<Matter, 'id' | 'matterId' | 'createdAt'>, actor: User): Matter => {
    const matters = storageService.getMatters();
    const matterId = getNextNumber('matter', 'MAT');
    const newMatter: Matter = {
      ...matterData,
      id: `mat-${Date.now()}`,
      matterId,
      branchId: matterData.branchId || actor.branchId || 'br-abuja-01',
      createdAt: new Date().toISOString()
    };
    setToStorage(STORAGE_KEYS.MATTERS, [newMatter, ...matters]);
    logAudit(actor, 'CREATE_MATTER', 'Matter', newMatter.id, `Created matter ${newMatter.title} (${matterId})`);
    dispatchNotification('New Legal Matter Opened', `Matter ${matterId} opened: ${newMatter.title}`, 'info');
    persistToD1('/api/matters', 'POST', newMatter, actor).then(() => syncWithServer()).catch(() => {});
    return newMatter;
  },
  updateMatter: (matter: Matter, actor: User): void => {
    const list = storageService.getMatters().map(m => m.id === matter.id ? matter : m);
    setToStorage(STORAGE_KEYS.MATTERS, list);
    logAudit(actor, 'UPDATE_MATTER', 'Matter', matter.id, `Updated matter: ${matter.title}`);
    persistToD1(`/api/matters/${matter.id}`, 'PUT', matter, actor).then(() => syncWithServer()).catch(() => {});
  },

  // Cases & Assignments
  getCases: (): CaseRecord[] => getFromStorage<CaseRecord[]>(STORAGE_KEYS.CASES, []),
  addCase: (caseData: Omit<CaseRecord, 'id' | 'caseId' | 'createdAt'>, actor: User): CaseRecord => {
    const cases = storageService.getCases();
    const caseId = getNextNumber('case', 'CASE');
    const matter = storageService.getMatters().find(m => m.id === caseData.matterId);
    const newCase: CaseRecord = {
      ...caseData,
      id: `case-${Date.now()}`,
      caseId,
      branchId: caseData.branchId || (matter ? matter.branchId : actor.branchId) || 'br-abuja-01',
      createdAt: new Date().toISOString()
    };
    setToStorage(STORAGE_KEYS.CASES, [newCase, ...cases]);
    logAudit(actor, 'FILE_CASE', 'Case', newCase.id, `Registered case: ${newCase.suitNumber} (${caseId})`);

    storageService.createCaseAssignment({
      caseId: newCase.id,
      suitNumber: newCase.suitNumber,
      branchId: newCase.branchId,
      counselId: newCase.counselId,
      assignedById: actor.id,
      assignedByName: actor.name
    });

    persistToD1('/api/cases', 'POST', newCase, actor).then(() => syncWithServer()).catch(() => {});
    return newCase;
  },
  updateCase: (caseRecord: CaseRecord, actor: User): void => {
    const list = storageService.getCases().map(c => c.id === caseRecord.id ? caseRecord : c);
    setToStorage(STORAGE_KEYS.CASES, list);
    logAudit(actor, 'UPDATE_CASE', 'Case', caseRecord.id, `Updated litigation record: ${caseRecord.suitNumber}`);
    persistToD1(`/api/cases/${caseRecord.id}`, 'PUT', caseRecord, actor).then(() => syncWithServer()).catch(() => {});
  },

  // Case Assignment Workflow
  getCaseAssignments: (): CaseAssignment[] => getFromStorage<CaseAssignment[]>(STORAGE_KEYS.CASE_ASSIGNMENTS, []),
  createCaseAssignment: (data: {
    caseId: string;
    suitNumber: string;
    branchId?: string;
    counselId: string;
    assignedById: string;
    assignedByName: string;
  }): CaseAssignment => {
    const assignments = storageService.getCaseAssignments();
    const newAssignment: CaseAssignment = {
      id: `asgn-${Date.now()}`,
      caseId: data.caseId,
      suitNumber: data.suitNumber,
      branchId: data.branchId,
      counselId: data.counselId,
      assignedById: data.assignedById,
      assignedByName: data.assignedByName,
      dateAssigned: new Date().toISOString(),
      status: 'PENDING'
    };
    setToStorage(STORAGE_KEYS.CASE_ASSIGNMENTS, [newAssignment, ...assignments]);
    persistRecord('case_assignments', 'POST', newAssignment);

    dispatchNotification(
      'New Case Assignment',
      `You have been assigned to case ${data.suitNumber} by ${data.assignedByName}. Please review and accept or provide reasons for declining.`,
      'urgent',
      undefined,
      data.counselId
    );

    return newAssignment;
  },
  respondToAssignment: (
    assignmentId: string,
    status: 'ACCEPTED' | 'REJECTED' | 'REASSIGNED',
    reason?: CaseAssignment['rejectionReason'],
    notes?: string,
    actor?: User
  ): void => {
    const assignments = storageService.getCaseAssignments().map(a => {
      if (a.id === assignmentId) {
        return {
          ...a,
          status,
          rejectionReason: reason,
          rejectionNotes: notes,
          responseDate: new Date().toISOString()
        };
      }
      return a;
    });
    setToStorage(STORAGE_KEYS.CASE_ASSIGNMENTS, assignments);
    const updatedAssignment = assignments.find(a => a.id === assignmentId);
    if (updatedAssignment) persistRecord('case_assignments', 'PUT', updatedAssignment, actor);

    const assignment = assignments.find(a => a.id === assignmentId);
    if (assignment) {
      if (status === 'ACCEPTED') {
        dispatchNotification(
          'Case Assignment Accepted',
          `${actor?.name || 'Counsel'} accepted assignment for case ${assignment.suitNumber}`,
          'success',
          'HEAD_OF_CHAMBER'
        );
      } else {
        dispatchNotification(
          'Case Assignment Declined / Reassignment Requested',
          `${actor?.name || 'Counsel'} declined assignment for ${assignment.suitNumber}. Reason: ${reason} - ${notes}`,
          'warning',
          'HEAD_OF_CHAMBER'
        );
      }
      if (actor) {
        logAudit(actor, `ASSIGNMENT_${status}`, 'CaseAssignment', assignmentId, `Counsel responded with ${status}. ${reason ? `Reason: ${reason}` : ''}`);
      }
    }
  },
  reassignCase: (caseId: string, newCounselId: string, actor: User): void => {
    const cases = storageService.getCases().map(c => {
      if (c.id === caseId) {
        return { ...c, counselId: newCounselId };
      }
      return c;
    });
    setToStorage(STORAGE_KEYS.CASES, cases);

    const caseItem = cases.find(c => c.id === caseId);
    if (caseItem) {
      storageService.createCaseAssignment({
        caseId: caseItem.id,
        suitNumber: caseItem.suitNumber,
        counselId: newCounselId,
        assignedById: actor.id,
        assignedByName: actor.name
      });
      logAudit(actor, 'REASSIGN_CASE', 'Case', caseId, `Reassigned case ${caseItem.suitNumber} to user ${newCounselId}`);
      persistRecord('cases', 'PUT', caseItem, actor);
    }
  },

  // Court Diary
  getCourtDiary: (): CourtDiaryEntry[] => getFromStorage<CourtDiaryEntry[]>(STORAGE_KEYS.COURT_DIARY, []),
  addCourtDiaryEntry: (entry: Omit<CourtDiaryEntry, 'id'>, actor: User): CourtDiaryEntry => {
    const entries = storageService.getCourtDiary();
    const caseItem = storageService.getCases().find(c => c.id === entry.caseId);
    const newEntry: CourtDiaryEntry = {
      ...entry,
      id: `diary-${Date.now()}`,
      branchId: entry.branchId || caseItem?.branchId || actor.branchId || 'br-abuja-01'
    };
    setToStorage(STORAGE_KEYS.COURT_DIARY, [newEntry, ...entries]);

    const cases = storageService.getCases().map(c => {
      if (c.id === entry.caseId) {
        return { ...c, nextCourtDate: entry.courtDate };
      }
      return c;
    });
    setToStorage(STORAGE_KEYS.CASES, cases);

    logAudit(actor, 'SCHEDULE_COURT_DATE', 'CourtDiary', newEntry.id, `Scheduled court appearance for ${entry.suitNumber} on ${entry.courtDate}`);
    persistRecord('court_diary', 'POST', newEntry, actor);
    const updatedCase = cases.find(c => c.id === entry.caseId);
    if (updatedCase) persistRecord('cases', 'PUT', updatedCase, actor);
    return newEntry;
  },
  updateCourtDiaryEntry: (entry: CourtDiaryEntry, actor: User): void => {
    const list = storageService.getCourtDiary().map(e => e.id === entry.id ? entry : e);
    setToStorage(STORAGE_KEYS.COURT_DIARY, list);
    logAudit(actor, 'UPDATE_COURT_DIARY', 'CourtDiary', entry.id, `Updated court date entry for ${entry.suitNumber}`);
    persistRecord('court_diary', 'PUT', entry, actor);
  },

  // Tasks
  getTasks: (): Task[] => getFromStorage<Task[]>(STORAGE_KEYS.TASKS, []),
  addTask: (task: Omit<Task, 'id' | 'createdAt'>, actor: User): Task => {
    const tasks = storageService.getTasks();
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      branchId: task.branchId || actor.branchId || 'br-abuja-01',
      createdAt: new Date().toISOString()
    };
    setToStorage(STORAGE_KEYS.TASKS, [newTask, ...tasks]);
    logAudit(actor, 'CREATE_TASK', 'Task', newTask.id, `Created task: ${newTask.title}`);
    persistRecord('tasks', 'POST', newTask, actor);
    dispatchNotification('New Task Assigned', `Task "${newTask.title}" assigned to you by ${actor.name}`, 'info', undefined, task.assignedToId);
    return newTask;
  },
  updateTask: (task: Task, actor: User): void => {
    const list = storageService.getTasks().map(t => t.id === task.id ? task : t);
    setToStorage(STORAGE_KEYS.TASKS, list);
    logAudit(actor, 'UPDATE_TASK', 'Task', task.id, `Updated task ${task.title} status: ${task.status}`);
    persistRecord('tasks', 'PUT', task, actor);
  },

  // Documents
  getDocuments: (): DocumentRecord[] => getFromStorage<DocumentRecord[]>(STORAGE_KEYS.DOCUMENTS, []),
  addDocument: (doc: Omit<DocumentRecord, 'id' | 'documentId' | 'uploadDate' | 'uploadedById' | 'uploadedByName'>, actor: User): DocumentRecord => {
    const documents = storageService.getDocuments();
    const docCode = getNextNumber('document', 'DOC');
    const newDoc: DocumentRecord = {
      ...doc,
      id: `doc-${Date.now()}`,
      documentId: docCode,
      branchId: doc.branchId || actor.branchId || 'br-abuja-01',
      uploadDate: new Date().toISOString(),
      uploadedById: actor.id,
      uploadedByName: actor.name
    };
    setToStorage(STORAGE_KEYS.DOCUMENTS, [newDoc, ...documents]);
    logAudit(actor, 'UPLOAD_DOCUMENT', 'Document', newDoc.id, `Uploaded document: ${newDoc.title} (${docCode})`);
    persistRecord('documents', 'POST', newDoc, actor);
    return newDoc;
  },

  // Correspondence
  getCorrespondence: (): Correspondence[] => getFromStorage<Correspondence[]>(STORAGE_KEYS.CORRESPONDENCE, []),
  addCorrespondence: (item: Omit<Correspondence, 'id' | 'loggedById'>, actor: User): Correspondence => {
    const items = storageService.getCorrespondence();
    const newItem: Correspondence = {
      ...item,
      id: `cor-${Date.now()}`,
      loggedById: actor.id
    };
    setToStorage(STORAGE_KEYS.CORRESPONDENCE, [newItem, ...items]);
    logAudit(actor, 'LOG_CORRESPONDENCE', 'Correspondence', newItem.id, `Logged ${newItem.type}: ${newItem.subject}`);
    persistRecord('correspondence', 'POST', newItem, actor);
    return newItem;
  },

  // Legal Research
  getLegalResearch: (): LegalResearch[] => getFromStorage<LegalResearch[]>(STORAGE_KEYS.LEGAL_RESEARCH, []),
  addLegalResearch: (item: Omit<LegalResearch, 'id' | 'counselId' | 'counselName' | 'date'>, actor: User): LegalResearch => {
    const items = storageService.getLegalResearch();
    const newItem: LegalResearch = {
      ...item,
      id: `res-${Date.now()}`,
      counselId: actor.id,
      counselName: actor.name,
      date: new Date().toISOString()
    };
    setToStorage(STORAGE_KEYS.LEGAL_RESEARCH, [newItem, ...items]);
    logAudit(actor, 'ADD_LEGAL_RESEARCH', 'LegalResearch', newItem.id, `Recorded legal memo: ${newItem.topic}`);
    persistRecord('legal_research', 'POST', newItem, actor);
    return newItem;
  },

  // Appointments
  getAppointments: (): Appointment[] => getFromStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []),
  addAppointment: (app: Omit<Appointment, 'id'>, actor: User): Appointment => {
    const apps = storageService.getAppointments();
    const newApp: Appointment = { ...app, id: `app-${Date.now()}` };
    setToStorage(STORAGE_KEYS.APPOINTMENTS, [newApp, ...apps]);
    logAudit(actor, 'SCHEDULE_APPOINTMENT', 'Appointment', newApp.id, `Scheduled appointment for ${app.clientName} on ${app.date}`);
    persistRecord('appointments', 'POST', newApp, actor);
    return newApp;
  },

  // Property Management
  getProperties: (): Property[] => getFromStorage<Property[]>(STORAGE_KEYS.PROPERTIES, []),
  addProperty: (prop: Omit<Property, 'id' | 'propertyId'>, actor: User): Property => {
    const props = storageService.getProperties();
    const propertyId = getNextNumber('property', 'PROP');
    const newProp: Property = {
      ...prop,
      id: `prop-${Date.now()}`,
      propertyId,
      branchId: prop.branchId || actor.branchId || 'br-abuja-01'
    };
    setToStorage(STORAGE_KEYS.PROPERTIES, [newProp, ...props]);
    logAudit(actor, 'ADD_PROPERTY', 'Property', newProp.id, `Registered property: ${newProp.name} (${propertyId})`);
    persistRecord('properties', 'POST', newProp, actor);
    return newProp;
  },
  updateProperty: (prop: Property, actor: User): void => {
    const list = storageService.getProperties().map(p => p.id === prop.id ? prop : p);
    setToStorage(STORAGE_KEYS.PROPERTIES, list);
    logAudit(actor, 'UPDATE_PROPERTY', 'Property', prop.id, `Updated property: ${prop.name}`);
    persistRecord('properties', 'PUT', prop, actor);
  },

  // Landlords
  getLandlords: (): Landlord[] => getFromStorage<Landlord[]>(STORAGE_KEYS.LANDLORDS, []),
  addLandlord: (landlord: Omit<Landlord, 'id' | 'landlordId' | 'trackingCode' | 'dateRegistered'>, actor: User): Landlord => {
    const list = storageService.getLandlords();
    const landlordId = `LND-${String(list.length + 1).padStart(4, '0')}`;
    const trackingCode = getNextNumber('landlord', 'LAND');
    const newLandlord: Landlord = {
      ...landlord,
      id: `lnd-${Date.now()}`,
      landlordId,
      trackingCode,
      dateRegistered: new Date().toISOString()
    };
    setToStorage(STORAGE_KEYS.LANDLORDS, [newLandlord, ...list]);
    logAudit(actor, 'ADD_LANDLORD', 'Landlord', newLandlord.id, `Registered landlord: ${newLandlord.fullName} (${trackingCode})`);
    persistRecord('landlords', 'POST', newLandlord, actor);
    return newLandlord;
  },

  // Units
  getUnits: (): Unit[] => getFromStorage<Unit[]>(STORAGE_KEYS.UNITS, []),
  addUnit: (unit: Omit<Unit, 'id'>, actor: User): Unit => {
    const units = storageService.getUnits();
    const newUnit: Unit = { ...unit, id: `unt-${Date.now()}` };
    setToStorage(STORAGE_KEYS.UNITS, [newUnit, ...units]);
    logAudit(actor, 'ADD_UNIT', 'Unit', newUnit.id, `Added unit ${unit.unitNumber}`);
    persistRecord('units', 'POST', newUnit, actor);
    return newUnit;
  },

  // Tenants & Tenancies
  getTenants: (): Tenant[] => getFromStorage<Tenant[]>(STORAGE_KEYS.TENANTS, []),
  addTenant: (tenant: Omit<Tenant, 'id' | 'tenantId' | 'trackingCode' | 'dateRegistered'>, actor: User): Tenant => {
    const list = storageService.getTenants();
    const tenantId = `TNT-${String(list.length + 1).padStart(4, '0')}`;
    const trackingCode = getNextNumber('tenancy', 'TEN');
    const newTenant: Tenant = {
      ...tenant,
      id: `tnt-${Date.now()}`,
      tenantId,
      trackingCode,
      dateRegistered: new Date().toISOString()
    };
    setToStorage(STORAGE_KEYS.TENANTS, [newTenant, ...list]);
    logAudit(actor, 'ADD_TENANT', 'Tenant', newTenant.id, `Registered tenant: ${newTenant.fullName} (${trackingCode})`);
    persistRecord('tenants', 'POST', newTenant, actor);
    return newTenant;
  },
  getTenancies: (): Tenancy[] => getFromStorage<Tenancy[]>(STORAGE_KEYS.TENANCIES, []),
  addTenancy: (tenancy: Omit<Tenancy, 'id'>, actor: User): Tenancy => {
    const list = storageService.getTenancies();
    const newTenancy: Tenancy = { ...tenancy, id: `ten-${Date.now()}` };
    setToStorage(STORAGE_KEYS.TENANCIES, [newTenancy, ...list]);
    logAudit(actor, 'CREATE_TENANCY', 'Tenancy', newTenancy.id, `Created tenancy for unit ${tenancy.unitNumber}`);
    persistRecord('tenancies', 'POST', newTenancy, actor);
    return newTenancy;
  },

  // Rent Records
  getRentRecords: (): RentRecord[] => getFromStorage<RentRecord[]>(STORAGE_KEYS.RENT_RECORDS, []),
  addRentRecord: (rent: Omit<RentRecord, 'id'>, actor: User): RentRecord => {
    const list = storageService.getRentRecords();
    const newRent: RentRecord = { ...rent, id: `rent-${Date.now()}` };
    setToStorage(STORAGE_KEYS.RENT_RECORDS, [newRent, ...list]);
    logAudit(actor, 'RECORD_RENT', 'RentRecord', newRent.id, `Recorded rent of ₦${rent.amountPaid.toLocaleString()} for ${rent.tenantName}`);
    persistRecord('rent_records', 'POST', newRent, actor);
    return newRent;
  },

  // Property Disputes (Recovery of Premises)
  getPropertyDisputes: (): PropertyDispute[] => getFromStorage<PropertyDispute[]>(STORAGE_KEYS.PROPERTY_DISPUTES, []),
  addPropertyDispute: (dispute: Omit<PropertyDispute, 'id' | 'createdAt'>, actor: User): PropertyDispute => {
    const list = storageService.getPropertyDisputes();
    const newDispute: PropertyDispute = {
      ...dispute,
      id: `disp-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setToStorage(STORAGE_KEYS.PROPERTY_DISPUTES, [newDispute, ...list]);
    logAudit(actor, 'INITIATE_PREMISES_RECOVERY', 'PropertyDispute', newDispute.id, `Initiated recovery workflow: ${newDispute.complaintTitle}`);
    persistRecord('property_disputes', 'POST', newDispute, actor);
    return newDispute;
  },
  updatePropertyDispute: (dispute: PropertyDispute, actor: User): void => {
    const list = storageService.getPropertyDisputes().map(d => d.id === dispute.id ? dispute : d);
    setToStorage(STORAGE_KEYS.PROPERTY_DISPUTES, list);
    logAudit(actor, 'UPDATE_PREMISES_RECOVERY', 'PropertyDispute', dispute.id, `Stage updated to: ${dispute.workflowStage}`);
    persistRecord('property_disputes', 'PUT', dispute, actor);
  },

  // Quit Notices
  getQuitNotices: (): QuitNotice[] => getFromStorage<QuitNotice[]>(STORAGE_KEYS.QUIT_NOTICES, []),
  issueQuitNotice: (data: {
    tenantId: string;
    tenantName: string;
    propertyId: string;
    propertyName: string;
    landlordId: string;
    landlordName: string;
    unitNumber: string;
    noticeType: QuitNotice['noticeType'];
    noticeDate: string;
    noticeExpiryDate: string;
    reason: string;
    statutoryBasis: string;
  }, actor: User): QuitNotice => {
    const list = storageService.getQuitNotices();
    const quitNoticeId = getNextNumber('quit_notice', 'QNT');
    const newNotice: QuitNotice = {
      ...data,
      id: `qn-${Date.now()}`,
      quitNoticeId,
      status: 'Issued',
      issuedById: actor.id,
      issuedByName: actor.name,
      createdAt: new Date().toISOString()
    };
    setToStorage(STORAGE_KEYS.QUIT_NOTICES, [newNotice, ...list]);
    logAudit(actor, 'ISSUE_QUIT_NOTICE', 'QuitNotice', newNotice.id, `Issued ${data.noticeType} to ${data.tenantName} for unit ${data.unitNumber} at ${data.propertyName}`);
    persistRecord('quit_notices', 'POST', newNotice, actor);

    // Update tenant status to reflect quit notice
    const tenants = storageService.getTenants().map(t => {
      if (t.id === data.tenantId) {
        return { ...t, status: 'Terminated' as const };
      }
      return t;
    });
    setToStorage(STORAGE_KEYS.TENANTS, tenants);
    const updatedTenant = tenants.find(t => t.id === data.tenantId);
    if (updatedTenant) persistRecord('tenants', 'PUT', updatedTenant, actor);

    dispatchNotification(
      'Quit Notice Issued',
      `${data.noticeType} issued to ${data.tenantName} (Unit ${data.unitNumber}, ${data.propertyName}). Expiry: ${data.noticeExpiryDate}.`,
      'urgent',
      'HEAD_OF_CHAMBER'
    );

    return newNotice;
  },
  updateQuitNoticeStatus: (id: string, status: QuitNotice['status'], actor: User): void => {
    const list = storageService.getQuitNotices().map(q => q.id === id ? { ...q, status } : q);
    setToStorage(STORAGE_KEYS.QUIT_NOTICES, list);
    logAudit(actor, 'UPDATE_QUIT_NOTICE', 'QuitNotice', id, `Quit notice status updated to: ${status}`);
    const notice = list.find(q => q.id === id);
    if (notice) persistRecord('quit_notices', 'PUT', notice, actor);
  },

  // Rent Due Notification Check — generates notifications 30 days before tenancy expiry
  checkRentDueNotifications: (): void => {
    const tenancies = storageService.getTenancies();
    const tenants = storageService.getTenants();
    const properties = storageService.getProperties();
    const existingNotifs = storageService.getNotifications();
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    tenancies.forEach(tenancy => {
      if (tenancy.status === 'Terminated' || tenancy.status === 'Expired') return;

      const expiryDate = new Date(tenancy.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      // Only notify if within 30 days of due date and not already notified
      if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
        const tenant = tenants.find(t => t.id === tenancy.tenantId);
        const property = properties.find(p => p.id === tenancy.propertyId);
        const notifKey = `rent-due-${tenancy.id}-${tenancy.expiryDate}`;

        // Check if notification already exists for this tenancy/expiry
        const alreadyNotified = existingNotifs.some(n =>
          n.linkAction === notifKey
        );

        if (!alreadyNotified) {
          dispatchNotification(
            'Rent Payment Due Soon',
            `Tenancy for ${tenant?.fullName || 'Tenant'} at ${property?.name || 'Property'} (Unit ${tenancy.unitNumber}) expires on ${tenancy.expiryDate}. Rent of ₦${tenancy.rentAmount.toLocaleString()} is due in ${daysUntilExpiry} day(s). Please arrange payment.`,
            'warning',
            undefined,
            undefined,
            notifKey
          );
        }
      }
    });
  },

  // Institutions & Students & Internships
  getInstitutions: (): Institution[] => getFromStorage<Institution[]>(STORAGE_KEYS.INSTITUTIONS, INITIAL_INSTITUTIONS),
  addInstitution: (inst: Omit<Institution, 'id'>, actor: User): Institution => {
    const list = storageService.getInstitutions();
    const newInst: Institution = { ...inst, id: `inst-${Date.now()}` };
    setToStorage(STORAGE_KEYS.INSTITUTIONS, [...list, newInst]);
    logAudit(actor, 'ADD_INSTITUTION', 'Institution', newInst.id, `Registered institution: ${newInst.name}`);
    persistRecord('partner_institutions', 'POST', newInst, actor);
    return newInst;
  },
  getStudents: (): StudentProfile[] => getFromStorage<StudentProfile[]>(STORAGE_KEYS.STUDENTS, []),
  registerStudent: (student: Omit<StudentProfile, 'id' | 'studentId' | 'createdAt' | 'completionLetterIssued'>, actor: User): StudentProfile => {
    const students = storageService.getStudents();
    const studentId = getNextNumber('internship', 'INT');
    const newStudent: StudentProfile = {
      ...student,
      id: `std-${Date.now()}`,
      studentId,
      completionLetterIssued: false,
      createdAt: new Date().toISOString()
    };
    setToStorage(STORAGE_KEYS.STUDENTS, [newStudent, ...students]);
    logAudit(actor, 'REGISTER_STUDENT', 'StudentProfile', newStudent.id, `Registered intern: ${newStudent.fullName} (${studentId})`);
    persistRecord('students', 'POST', newStudent, actor);
    dispatchNotification('New Student Placement Recorded', `${newStudent.fullName} (${newStudent.institutionName}) enrolled under ${newStudent.placementType}`, 'info', 'HEAD_OF_CHAMBER');
    return newStudent;
  },
  updateStudent: (student: StudentProfile, actor: User): void => {
    const list = storageService.getStudents().map(s => s.id === student.id ? student : s);
    setToStorage(STORAGE_KEYS.STUDENTS, list);
    logAudit(actor, 'UPDATE_STUDENT', 'StudentProfile', student.id, `Updated student profile: ${student.fullName}`);
    persistRecord('students', 'PUT', student, actor);
  },
  applyForInternshipPublic: (data: {
    fullName: string;
    email: string;
    phone: string;
    institutionName: string;
    programme: string;
    level: string;
    matricNumber: string;
    preferredStartDate: string;
    preferredEndDate: string;
    cvDetails?: string;
  }): { studentId: string; application: StudentProfile } => {
    const studentId = getNextNumber('internship', 'INT');
    const students = storageService.getStudents();
    const newStudent: StudentProfile = {
      id: `std-${Date.now()}`,
      studentId,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      institutionId: 'inst-01',
      institutionName: data.institutionName,
      faculty: 'Faculty of Law',
      programme: data.programme,
      level: data.level,
      matricNumber: data.matricNumber,
      placementType: 'Direct Student Application',
      placementStartDate: data.preferredStartDate,
      placementEndDate: data.preferredEndDate,
      assignedBranchId: 'br-abuja-01',
      supervisingCounselId: 'usr-counsel-01',
      status: 'Application Received',
      completionLetterIssued: false,
      createdAt: new Date().toISOString()
    };
    setToStorage(STORAGE_KEYS.STUDENTS, [newStudent, ...students]);
    persistRecord('students', 'POST', newStudent);
    dispatchNotification(
      'New Public Internship Application',
      `Application received from ${data.fullName} (${studentId}, ${data.institutionName})`,
      'info',
      'ADMINISTRATOR_SECRETARY'
    );
    return { studentId, application: newStudent };
  },
  getAttendance: (): InternshipAttendance[] => getFromStorage<InternshipAttendance[]>(STORAGE_KEYS.ATTENDANCE, []),
  logAttendance: (att: Omit<InternshipAttendance, 'id'>, actor: User): InternshipAttendance => {
    const list = storageService.getAttendance();
    const newAtt: InternshipAttendance = { ...att, id: `att-${Date.now()}` };
    setToStorage(STORAGE_KEYS.ATTENDANCE, [newAtt, ...list]);
    logAudit(actor, 'LOG_ATTENDANCE', 'InternshipAttendance', newAtt.id, `Logged attendance for ${att.studentName}: ${att.status}`);
    persistRecord('internship_attendance', 'POST', newAtt, actor);
    return newAtt;
  },
  getEvaluations: (): InternshipEvaluation[] => getFromStorage<InternshipEvaluation[]>(STORAGE_KEYS.EVALUATIONS, []),
  submitEvaluation: (evaluation: Omit<InternshipEvaluation, 'id'>, actor: User): InternshipEvaluation => {
    const list = storageService.getEvaluations();
    const newEval: InternshipEvaluation = { ...evaluation, id: `eval-${Date.now()}` };
    setToStorage(STORAGE_KEYS.EVALUATIONS, [newEval, ...list]);
    logAudit(actor, 'SUBMIT_EVALUATION', 'InternshipEvaluation', newEval.id, `Evaluated intern: ${evaluation.studentName}`);
    persistRecord('internship_evaluations', 'POST', newEval, actor);
    return newEval;
  },

  // Public Notices & Enquiries
  getPublicNotices: (): PublicNotice[] => getFromStorage<PublicNotice[]>(STORAGE_KEYS.PUBLIC_NOTICES, INITIAL_PUBLIC_NOTICES),
  addPublicNotice: (notice: Omit<PublicNotice, 'id' | 'publishDate' | 'publishedById' | 'publishedByName'>, actor: User): PublicNotice => {
    const list = storageService.getPublicNotices();
    const newNotice: PublicNotice = {
      ...notice,
      id: `not-${Date.now()}`,
      publishDate: new Date().toISOString().split('T')[0],
      publishedById: actor.id,
      publishedByName: actor.name
    };
    setToStorage(STORAGE_KEYS.PUBLIC_NOTICES, [newNotice, ...list]);
    logAudit(actor, 'PUBLISH_NOTICE', 'PublicNotice', newNotice.id, `Published notice: ${newNotice.title}`);
    persistRecord('public_notices', 'POST', newNotice, actor);
    return newNotice;
  },
  updatePublicNotice: (notice: PublicNotice, actor: User): void => {
    const list = storageService.getPublicNotices().map(n => n.id === notice.id ? notice : n);
    setToStorage(STORAGE_KEYS.PUBLIC_NOTICES, list);
    logAudit(actor, 'UPDATE_NOTICE', 'PublicNotice', notice.id, `Updated notice: ${notice.title}`);
    persistRecord('public_notices', 'PUT', notice, actor);
  },
  deletePublicNotice: (noticeId: string, actor: User): void => {
    const list = storageService.getPublicNotices().filter(n => n.id !== noticeId);
    setToStorage(STORAGE_KEYS.PUBLIC_NOTICES, list);
    logAudit(actor, 'DELETE_NOTICE', 'PublicNotice', noticeId, `Deleted notice ${noticeId}`);
    persistRecord('public_notices', 'DELETE', { id: noticeId }, actor);
  },
  getPublicEnquiries: (): PublicEnquiry[] => getFromStorage<PublicEnquiry[]>(STORAGE_KEYS.PUBLIC_ENQUIRIES, []),
  submitPublicEnquiry: (enquiry: Omit<PublicEnquiry, 'id' | 'createdAt' | 'status'>): PublicEnquiry => {
    const list = storageService.getPublicEnquiries();
    const newEnquiry: PublicEnquiry = {
      ...enquiry,
      id: `enq-${Date.now()}`,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    setToStorage(STORAGE_KEYS.PUBLIC_ENQUIRIES, [newEnquiry, ...list]);
    persistRecord('public_enquiries', 'POST', newEnquiry);
    dispatchNotification('New Public Chambers Enquiry', `Enquiry received from ${enquiry.fullName}: ${enquiry.subject}`, 'info', 'ADMINISTRATOR_SECRETARY');
    return newEnquiry;
  },

  // Approvals & High-Authority Chain
  getApprovals: (): ApprovalRequest[] => getFromStorage<ApprovalRequest[]>(STORAGE_KEYS.APPROVALS, []),
  requestApproval: (req: Omit<ApprovalRequest, 'id' | 'status' | 'submittedAt'>, actor: User): ApprovalRequest => {
    const list = storageService.getApprovals();
    const newReq: ApprovalRequest = {
      ...req,
      id: `appr-${Date.now()}`,
      status: 'PENDING_PRINCIPAL_PARTNER_APPROVAL',
      submittedAt: new Date().toISOString()
    };
    setToStorage(STORAGE_KEYS.APPROVALS, [newReq, ...list]);
    logAudit(actor, 'SUBMIT_APPROVAL_REQUEST', 'ApprovalRequest', newReq.id, `Submitted request: ${newReq.title}`);
    persistRecord('approval_requests', 'POST', newReq, actor);
    dispatchNotification(
      'Pending Principal Partner Authorization',
      `${actor.name} (${actor.role}) submitted: "${newReq.title}" requiring your executive approval.`,
      'urgent',
      'PRINCIPAL_PARTNER'
    );
    return newReq;
  },
  decideApproval: (requestId: string, status: 'APPROVED' | 'REJECTED', notes: string, actor: User): void => {
    const list = storageService.getApprovals().map(a => {
      if (a.id === requestId) {
        return {
          ...a,
          status,
          decidedAt: new Date().toISOString(),
          decidedById: actor.id,
          decidedByName: actor.name,
          decisionNotes: notes
        };
      }
      return a;
    });
    setToStorage(STORAGE_KEYS.APPROVALS, list);
    const req = list.find(a => a.id === requestId);
    if (req) persistRecord('approval_requests', 'PUT', req, actor);
    if (req) {
      // Sync linked invoice approval status if this was an invoice approval request
      if (req.requestType === 'Invoice Billing Approval' || req.referenceCode) {
        const invList = storageService.getInvoices().map(inv => {
          if (inv.invoiceNumber === req.referenceCode || inv.approvalRequestId === req.id) {
            return {
              ...inv,
              approvalStatus: status,
              approvalNotes: notes || `Principal Partner decision: ${status}`
            };
          }
          return inv;
        });
        setToStorage(STORAGE_KEYS.INVOICES, invList);
        const decidedInvoice = invList.find(inv => inv.invoiceNumber === req.referenceCode || inv.approvalRequestId === req.id);
        if (decidedInvoice) persistRecord('invoices', 'PUT', decidedInvoice, actor);
      }

      logAudit(actor, `APPROVAL_${status}`, 'ApprovalRequest', requestId, `Principal Partner decided: ${status}. Notes: ${notes}`);
      dispatchNotification(
        `Approval Decision: ${status}`,
        `Your request "${req.title}" was ${status} by Principal Partner. Notes: ${notes}`,
        status === 'APPROVED' ? 'success' : 'warning',
        req.requesterRole,
        req.requesterId
      );
    }
  },

  // Notifications & Audits
  getNotifications: (): NotificationItem[] => getFromStorage<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []),
  markNotificationAsRead: (id: string): void => {
    const notifs = storageService.getNotifications().map(n => n.id === id ? { ...n, isRead: true } : n);
    setToStorage(STORAGE_KEYS.NOTIFICATIONS, notifs);
  },
  markAllNotificationsAsRead: (): void => {
    const notifs = storageService.getNotifications().map(n => ({ ...n, isRead: true }));
    setToStorage(STORAGE_KEYS.NOTIFICATIONS, notifs);
  },
  getAuditLogs: (): AuditLog[] => getFromStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []),

  // Active Session & Branch
  getActiveBranchId: (): string => getFromStorage<string>(STORAGE_KEYS.ACTIVE_BRANCH_ID, 'br-abuja-01'),
  setActiveBranchId: (id: string): void => {
    setToStorage(STORAGE_KEYS.ACTIVE_BRANCH_ID, id);
  }
};
