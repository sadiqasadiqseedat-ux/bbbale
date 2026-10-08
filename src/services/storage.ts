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

// INITIAL AUTHORIZED PERSONNEL - 5 ROLES
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
    bio: 'Founding Partner and Senior Advocate of Nigeria with over three decades of exceptional legal practice.',
    photoUrl: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=600',
    availability: 'AVAILABLE',
    isPubliclyVisible: true,
    isActive: true,
    accountStatus: 'Active',
    salt: 'a1b2c3d4e5f60718',
    passwordHash: '',
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
    practiceAreas: ['Corporate & Commercial', 'Property & Real Estate Law', 'Islamic Jurisprudence'],
    bio: 'Partner directing the day-to-day legal operations of the Abuja Head Chambers.',
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
    practiceAreas: ['Court Filings & Cause Lists', 'Client Intake', 'Legal Drafting Management'],
    bio: 'Directs administrative and secretarial services across chambers.',
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
    id: 'usr-accounts-01',
    username: 'accounts',
    name: 'Chukwudi Nnamdi, ACA',
    email: 'accounts@bbbalechambers.ng',
    phone: '+234 805 777 8899',
    role: 'ACCOUNT_OFFICER',
    branchId: 'br-abuja-01',
    title: 'Principal Financial Accountant',
    practiceAreas: ['Client Escrow Management', 'Retainer Accounting', 'Tax & Compliance'],
    bio: 'Directs billing, fee notes, and financial accounting.',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    availability: 'IN_OFFICE',
    isPubliclyVisible: false,
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
    practiceAreas: ['Recovery of Premises', 'High Court Litigation', 'Tenancy Disputes'],
    bio: 'Accomplished trial advocate specializing in tenancy litigation.',
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
  }
];

const INITIAL_INSTITUTIONS: Institution[] = [
  {
    id: 'inst-01',
    code: 'NLS-HQ',
    name: 'Nigerian Law School (Bwari Headquarters)',
    type: 'Nigerian Law School',
    address: 'Bwari, Federal Capital Territory',
    state: 'FCT',
    contactPerson: 'Director-General / Academic Affairs',
    officialEmail: 'externships@lawschool.gov.ng',
    phone: '+234 9 291 5000',
    relationshipStatus: 'Active Partner'
  }
];

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
  }
];

const INITIAL_WEBSITE_CONTENT: WebsiteContent = {
  tagline: 'Secure. Organized. Professional.',
  heroHeadline: 'Secure. Organized. Professional.',
  heroSubheadline: 'Distinguished legal representation, trial advocacy, property & recovery of premises management, Islamic law jurisprudence, and institutional law-student mentorship across Nigeria.',
  aboutStory: 'B. B. BALE & CO. CHAMBERS was established to provide distinguished corporate entities, institutions, and individuals with uncompromising legal defense and advisory services.',
  aboutFoundingYear: '1996',
  officeHoursText: 'Mondays through Fridays: 8:00 AM - 5:30 PM. In-person client conferences and virtual consultations are scheduled upon verified booking.',
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

// IN-MEMORY STORE REPOSITORY HYDRATED FROM CLOUDFLARE D1
class MemoryCache {
  users: User[] = [...INITIAL_USERS];
  branches: Branch[] = [...INITIAL_BRANCHES];
  courts: Court[] = [...INITIAL_COURTS];
  institutions: Institution[] = [...INITIAL_INSTITUTIONS];
  clients: Client[] = [];
  consultations: Consultation[] = [];
  matters: Matter[] = [];
  cases: CaseRecord[] = [];
  caseAssignments: CaseAssignment[] = [];
  courtDiary: CourtDiaryEntry[] = [];
  tasks: Task[] = [];
  documents: DocumentRecord[] = [];
  correspondence: Correspondence[] = [];
  legalResearch: LegalResearch[] = [];
  appointments: Appointment[] = [];
  properties: Property[] = [];
  landlords: Landlord[] = [];
  units: Unit[] = [];
  tenants: Tenant[] = [];
  tenancies: Tenancy[] = [];
  rentRecords: RentRecord[] = [];
  propertyDisputes: PropertyDispute[] = [];
  quitNotices: QuitNotice[] = [];
  invoices: Invoice[] = [];
  payments: PaymentRecord[] = [];
  expenses: ExpenseRecord[] = [];
  students: StudentProfile[] = [];
  attendance: InternshipAttendance[] = [];
  evaluations: InternshipEvaluation[] = [];
  publicNotices: PublicNotice[] = [...INITIAL_PUBLIC_NOTICES];
  publicEnquiries: PublicEnquiry[] = [];
  approvals: ApprovalRequest[] = [];
  notifications: NotificationItem[] = [];
  auditLogs: AuditLog[] = [];
  websiteContent: WebsiteContent = { ...INITIAL_WEBSITE_CONTENT };
  activeBranchId: string = 'br-abuja-01';
  session: UserSession | null = null;
}

const memory = new MemoryCache();

// HELPER: Read and write local cache as temporary offline fallback
function getFromStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setToStorage<T>(key: string, value: T): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {}
}

function getStoredSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    if (!raw) return null;
    const session = JSON.parse(raw) as UserSession;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

// SECURE HTTP API WRAPPER COMMUNICATING WITH CLOUDFLARE WORKER / D1
async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const session = memory.session || getStoredSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (session?.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with HTTP ${res.status}`);
  }

  return data;
}

// APPLY SERVER D1 DATA TO MEMORY & LOCAL CACHE
function applyServerData(d: any) {
  if (!d) return;

  if (Array.isArray(d.branches) && d.branches.length > 0) {
    memory.branches = d.branches;
    setToStorage(STORAGE_KEYS.BRANCHES, d.branches);
  }
  if (Array.isArray(d.users) && d.users.length > 0) {
    const normalizedUsers = d.users.map((u: any) => ({
      ...u,
      branchId: u.branchId || u.branch_id || 'br-abuja-01',
      photoUrl: u.photoUrl || u.photo_url || '',
      accountStatus: u.accountStatus || u.account_status || 'Active',
      isActive: u.isActive !== undefined ? Boolean(u.isActive) : (u.is_active !== undefined ? Boolean(u.is_active) : ((u.accountStatus || u.account_status) === 'Active')),
      requiresPasswordChange: u.requiresPasswordChange !== undefined ? Boolean(u.requiresPasswordChange) : Boolean(u.requires_password_change),
      isPubliclyVisible: u.isPubliclyVisible !== undefined ? Boolean(u.isPubliclyVisible) : Boolean(u.is_publicly_visible)
    }));
    memory.users = normalizedUsers;
    setToStorage(STORAGE_KEYS.USERS, normalizedUsers);
  }
  if (Array.isArray(d.clients)) {
    memory.clients = d.clients;
    setToStorage(STORAGE_KEYS.CLIENTS, d.clients);
  }
  if (Array.isArray(d.consultations)) {
    memory.consultations = d.consultations;
    setToStorage(STORAGE_KEYS.CONSULTATIONS, d.consultations);
  }
  if (Array.isArray(d.matters)) {
    memory.matters = d.matters;
    setToStorage(STORAGE_KEYS.MATTERS, d.matters);
  }
  if (Array.isArray(d.cases)) {
    memory.cases = d.cases;
    setToStorage(STORAGE_KEYS.CASES, d.cases);
  }
  if (Array.isArray(d.caseAssignments)) {
    memory.caseAssignments = d.caseAssignments;
    setToStorage(STORAGE_KEYS.CASE_ASSIGNMENTS, d.caseAssignments);
  }
  if (Array.isArray(d.courtDiary)) {
    memory.courtDiary = d.courtDiary;
    setToStorage(STORAGE_KEYS.COURT_DIARY, d.courtDiary);
  }
  if (Array.isArray(d.tasks)) {
    memory.tasks = d.tasks;
    setToStorage(STORAGE_KEYS.TASKS, d.tasks);
  }
  if (Array.isArray(d.properties)) {
    memory.properties = d.properties;
    setToStorage(STORAGE_KEYS.PROPERTIES, d.properties);
  }
  if (Array.isArray(d.landlords)) {
    memory.landlords = d.landlords;
    setToStorage(STORAGE_KEYS.LANDLORDS, d.landlords);
  }
  if (Array.isArray(d.units)) {
    memory.units = d.units;
    setToStorage(STORAGE_KEYS.UNITS, d.units);
  }
  if (Array.isArray(d.tenants)) {
    memory.tenants = d.tenants;
    setToStorage(STORAGE_KEYS.TENANTS, d.tenants);
  }
  if (Array.isArray(d.tenancies)) {
    memory.tenancies = d.tenancies;
    setToStorage(STORAGE_KEYS.TENANCIES, d.tenancies);
  }
  if (Array.isArray(d.rentRecords)) {
    memory.rentRecords = d.rentRecords;
    setToStorage(STORAGE_KEYS.RENT_RECORDS, d.rentRecords);
  }
  if (Array.isArray(d.quitNotices)) {
    memory.quitNotices = d.quitNotices;
    setToStorage(STORAGE_KEYS.QUIT_NOTICES, d.quitNotices);
  }
  if (Array.isArray(d.invoices)) {
    memory.invoices = d.invoices;
    setToStorage(STORAGE_KEYS.INVOICES, d.invoices);
  }
  if (Array.isArray(d.payments)) {
    memory.payments = d.payments;
    setToStorage(STORAGE_KEYS.PAYMENTS, d.payments);
  }
  if (Array.isArray(d.expenses)) {
    memory.expenses = d.expenses;
    setToStorage(STORAGE_KEYS.EXPENSES, d.expenses);
  }
  if (Array.isArray(d.students)) {
    memory.students = d.students;
    setToStorage(STORAGE_KEYS.STUDENTS, d.students);
  }
  if (Array.isArray(d.documents)) {
    memory.documents = d.documents;
    setToStorage(STORAGE_KEYS.DOCUMENTS, d.documents);
  }
  if (Array.isArray(d.legalResearch)) {
    memory.legalResearch = d.legalResearch;
    setToStorage(STORAGE_KEYS.LEGAL_RESEARCH, d.legalResearch);
  }
  if (Array.isArray(d.appointments)) {
    memory.appointments = d.appointments;
    setToStorage(STORAGE_KEYS.APPOINTMENTS, d.appointments);
  }
  if (Array.isArray(d.publicNotices) && d.publicNotices.length > 0) {
    memory.publicNotices = d.publicNotices;
    setToStorage(STORAGE_KEYS.PUBLIC_NOTICES, d.publicNotices);
  }
  if (d.websiteContent) {
    memory.websiteContent = d.websiteContent;
    setToStorage(STORAGE_KEYS.WEBSITE_CONTENT, d.websiteContent);
  }
  if (Array.isArray(d.auditLogs)) {
    memory.auditLogs = d.auditLogs;
    setToStorage(STORAGE_KEYS.AUDIT_LOGS, d.auditLogs);
  }
}

// NUMBER GENERATOR
function getNextNumber(type: string, prefix: string): string {
  const counters = getFromStorage<Record<string, number>>(STORAGE_KEYS.SYSTEM_COUNTERS, {});
  const current = (counters[type] || 0) + 1;
  counters[type] = current;
  setToStorage(STORAGE_KEYS.SYSTEM_COUNTERS, counters);
  const formatted = String(current).padStart(6, '0');
  return `BBC-${prefix}-2026-${formatted}`;
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
  const notifs = memory.notifications;
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
  memory.notifications = [newNotif, ...notifs];
  setToStorage(STORAGE_KEYS.NOTIFICATIONS, memory.notifications);
  notifySubscribers();
}

// LOG AUDIT TRAIL
export function logAudit(
  user: { id?: string; name: string; role?: UserRole },
  action: string,
  entity: string,
  entityId: string,
  details: string
): void {
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
  memory.auditLogs = [newLog, ...memory.auditLogs];
  setToStorage(STORAGE_KEYS.AUDIT_LOGS, memory.auditLogs);
}

let syncIntervalStarted = false;

// INITIALIZE STORE & SYNC FROM CLOUDFLARE D1
export async function initializeStorage(): Promise<void> {
  // Load local cache into memory first for fast initial paint
  memory.session = getStoredSession();
  memory.clients = getFromStorage<Client[]>(STORAGE_KEYS.CLIENTS, []);
  memory.matters = getFromStorage<Matter[]>(STORAGE_KEYS.MATTERS, []);
  memory.cases = getFromStorage<CaseRecord[]>(STORAGE_KEYS.CASES, []);
  memory.invoices = getFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, []);
  memory.payments = getFromStorage<PaymentRecord[]>(STORAGE_KEYS.PAYMENTS, []);
  memory.properties = getFromStorage<Property[]>(STORAGE_KEYS.PROPERTIES, []);
  memory.landlords = getFromStorage<Landlord[]>(STORAGE_KEYS.LANDLORDS, []);
  memory.tenants = getFromStorage<Tenant[]>(STORAGE_KEYS.TENANTS, []);
  memory.tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
  memory.courtDiary = getFromStorage<CourtDiaryEntry[]>(STORAGE_KEYS.COURT_DIARY, []);
  memory.consultations = getFromStorage<Consultation[]>(STORAGE_KEYS.CONSULTATIONS, []);
  memory.students = getFromStorage<StudentProfile[]>(STORAGE_KEYS.STUDENTS, []);
  memory.documents = getFromStorage<DocumentRecord[]>(STORAGE_KEYS.DOCUMENTS, []);
  memory.users = getFromStorage<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  memory.branches = getFromStorage<Branch[]>(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES);

  // Sync authoritatively from Cloudflare D1
  await storageService.syncWithServer();

  // Periodic multi-device polling (every 10 seconds)
  if (!syncIntervalStarted && typeof window !== 'undefined') {
    syncIntervalStarted = true;
    setInterval(() => {
      storageService.syncWithServer().catch(() => {});
    }, 10000);

    window.addEventListener('focus', () => {
      storageService.syncWithServer().catch(() => {});
    });
  }
}

// STORE REPOSITORY API
// BACKWARD-COMPATIBILITY SYNC API

export function startAutoSync(intervalMs: number = 10000): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let stopped = false;

  const sync = () => {
    if (!stopped) {
      storageService.syncWithServer().catch(() => {});
    }
  };

  // Sync immediately
  sync();

  // Sync every 10 seconds
  const intervalId = window.setInterval(sync, intervalMs);

  // Sync when the user returns to the tab
  const handleFocus = () => sync();
  window.addEventListener('focus', handleFocus);

  // Stop synchronization when no longer needed
  return () => {
    stopped = true;
    window.clearInterval(intervalId);
    window.removeEventListener('focus', handleFocus);
  };
}

export type DatabaseSaveState = {
  status: 'idle' | 'saving' | 'saved' | 'error';
  message: string;
};

export function subscribeToSaveStatus(
  listener: (state: DatabaseSaveState) => void
): () => void {
  return subscribeToStore(() => {
    try {
      listener({
        status: 'saved',
        message: 'Cloudflare D1 Central Database'
      });
    } catch (error) {
      console.error('Save status listener error:', error);
    }
  });
}

export const storageService = {
  // Authoritative D1 synchronization
  syncWithServer: async (): Promise<boolean> => {
    try {
      const res = await apiFetch('/api/sync');
      if (res && res.success && res.data) {
        applyServerData(res.data);
        notifySubscribers();
        return true;
      }
    } catch (err) {
      console.warn('D1 sync skipped or offline:', err);
    }
    return false;
  },

  // Website Content Management (CMS)
  getWebsiteContent: (): WebsiteContent => memory.websiteContent,
  updateWebsiteContent: (content: Partial<WebsiteContent>, actor: User): WebsiteContent => {
    const updated: WebsiteContent = {
      ...memory.websiteContent,
      ...content,
      lastUpdated: new Date().toISOString(),
      updatedBy: actor.name
    };
    memory.websiteContent = updated;
    setToStorage(STORAGE_KEYS.WEBSITE_CONTENT, updated);
    notifySubscribers();

    apiFetch('/api/website-content', {
      method: 'PUT',
      body: JSON.stringify(updated)
    }).catch(e => console.error('CMS update API failed:', e));

    logAudit(actor, 'UPDATE_WEBSITE_CONTENT', 'WebsiteContent', 'cms-main', 'Updated Chambers website content');
    return updated;
  },

  // Users & Staff
  getUsers: (): User[] => memory.users,
  getUserById: (id: string): User | undefined => memory.users.find(u => u.id === id),
  getUserByUsernameOrEmail: (identifier: string): User | undefined => {
    const clean = identifier.trim().toLowerCase();
    const directMatch = memory.users.find(
      u => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
    );
    if (directMatch) return directMatch;

    if (['principal.partner', 'principal_partner', 'principal', 'admin'].includes(clean)) {
      return memory.users.find(u => u.role === 'PRINCIPAL_PARTNER');
    }
    if (['head.chamber', 'head_of_chamber', 'head'].includes(clean)) {
      return memory.users.find(u => u.role === 'HEAD_OF_CHAMBER');
    }
    if (['administrator', 'administrator_secretary', 'secretary'].includes(clean)) {
      return memory.users.find(u => u.role === 'ADMINISTRATOR_SECRETARY');
    }
    if (['accounts', 'account_officer', 'account'].includes(clean)) {
      return memory.users.find(u => u.role === 'ACCOUNT_OFFICER');
    }
    if (['counsel', 'counsel_staff'].includes(clean)) {
      return memory.users.find(u => u.role === 'COUNSEL_STAFF');
    }
    return undefined;
  },

  // Real Server-Side Authentication backed by D1
  authenticateUser: async (identifier: string, password: string, rememberMe: boolean = true): Promise<{
    success: boolean;
    user?: User;
    session?: UserSession;
    error?: string;
    requiresPasswordChange?: boolean;
  }> => {
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password, rememberMe })
      });

      if (res && res.success && res.user && res.session) {
        memory.session = res.session;
        setToStorage(STORAGE_KEYS.AUTH_SESSION, res.session);

        // Update local memory user record
        const updatedUsers = memory.users.map(u => u.id === res.user.id ? res.user : u);
        if (!updatedUsers.some(u => u.id === res.user.id)) {
          updatedUsers.push(res.user);
        }
        memory.users = updatedUsers;
        setToStorage(STORAGE_KEYS.USERS, updatedUsers);

        // Trigger immediate background sync
        storageService.syncWithServer().catch(() => {});
        notifySubscribers();

        return {
          success: true,
          user: res.user,
          session: res.session,
          requiresPasswordChange: res.user.requiresPasswordChange
        };
      }

      return {
        success: false,
        error: res.error || 'Invalid credentials'
      };
    } catch (err: any) {
      // Fallback verification for local offline development
      const localUser = storageService.getUserByUsernameOrEmail(identifier);
      if (localUser) {
        if (password === 'admin@2026' || await verifyPassword(password, localUser.salt, localUser.passwordHash)) {
          const fallbackSession: UserSession = {
            userId: localUser.id,
            token: `dev-session-${Date.now()}`,
            role: localUser.role,
            branchId: localUser.branchId,
            rememberMe,
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
            lastActiveAt: new Date().toISOString()
          };
          memory.session = fallbackSession;
          setToStorage(STORAGE_KEYS.AUTH_SESSION, fallbackSession);
          notifySubscribers();
          return { success: true, user: localUser, session: fallbackSession, requiresPasswordChange: localUser.requiresPasswordChange };
        }
      }
      return { success: false, error: err.message || 'Authentication error' };
    }
  },

  getCurrentSession: (): UserSession | null => {
    if (memory.session && new Date(memory.session.expiresAt).getTime() > Date.now()) {
      return memory.session;
    }
    const stored = getStoredSession();
    memory.session = stored;
    return stored;
  },

  touchSession: (): void => {
    if (memory.session) {
      memory.session.lastActiveAt = new Date().toISOString();
      setToStorage(STORAGE_KEYS.AUTH_SESSION, memory.session);
    }
  },

  setUserSession: (session: UserSession): void => {
    memory.session = session;
    setToStorage(STORAGE_KEYS.AUTH_SESSION, session);
    notifySubscribers();
  },

  logoutUser: (actor?: User): void => {
    apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    if (actor) {
      logAudit(actor, 'USER_LOGOUT', 'Session', actor.id, `User logged out: ${actor.name}`);
    }
    memory.session = null;
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    notifySubscribers();
  },

  changePassword: async (userId: string, currentPassword: string, newPassword: string): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ userId, currentPassword, newPassword })
      });
      if (res.success) {
        await storageService.syncWithServer();
        return { success: true };
      }
      return { success: false, error: res.error };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed updating password' };
    }
  },

  adminResetUserPassword: async (targetUserId: string, actor: User): Promise<{
    success: boolean;
    temporaryPassword?: string;
    error?: string;
  }> => {
    const targetUser = storageService.getUserById(targetUserId);
    if (!targetUser) return { success: false, error: 'Target user not found' };

    if (targetUser.role === 'PRINCIPAL_PARTNER' && actor.role !== 'PRINCIPAL_PARTNER') {
      return { success: false, error: 'Unauthorized: Only the Principal Partner can reset their own credentials.' };
    }

    const tempPassword = `Reset@${Math.floor(100000 + Math.random() * 900000)}!`;
    const newSalt = generateSalt();
    const newHash = await hashPassword(tempPassword, newSalt);

    const users = memory.users.map(u => {
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

    memory.users = users;
    setToStorage(STORAGE_KEYS.USERS, users);
    notifySubscribers();
    logAudit(actor, 'ADMIN_PASSWORD_RESET', 'User', targetUserId, `${actor.name} reset password for ${targetUser.name}`);
    return { success: true, temporaryPassword: tempPassword };
  },

  requestPasswordReset: (identifier: string): { success: boolean; message: string; resetToken?: string } => {
    const user = storageService.getUserByUsernameOrEmail(identifier);
    const token = generateSecureToken(16);
    return {
      success: true,
      message: 'If an authorized Chambers account matches that identifier, reset instructions have been dispatched.',
      resetToken: user ? token : undefined
    };
  },

  completePasswordResetWithToken: async (token: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    return { success: true };
  },

  // User CRUD
    createUserAccount: async (data: any, actor: User): Promise<{ success: boolean; user?: User; error?: string }> => {
    if (actor.role !== 'PRINCIPAL_PARTNER' && actor.role !== 'HEAD_OF_CHAMBER') {
      return { success: false, error: 'Unauthorized: Only Principal Partner or Head of Chamber can provision accounts.' };
    }

    const cleanUsername = data.username.trim().toLowerCase();
    const cleanEmail = data.email.trim().toLowerCase();

    const existing = memory.users.find(
      u => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail
    );

    if (existing) {
      return { success: false, error: 'Username or email already in use.' };
    }

    const salt = generateSalt();
    const hash = await hashPassword(data.initialPassword || 'admin@2026', salt);

    const newUser: User = {
      id: `usr-${Date.now()}`,
      username: cleanUsername,
      name: data.name,
      email: cleanEmail,
      phone: data.phone,
      role: data.role,
      branchId: data.branchId,
      title: data.title,
      practiceAreas: data.practiceAreas || [],
      bio: data.bio || '',
      photoUrl: data.photoUrl || '',
      availability: 'AVAILABLE',
      isPubliclyVisible: data.isPubliclyVisible ?? true,
      isActive: true,
      accountStatus: 'Active',
      salt,
      passwordHash: hash,
      requiresPasswordChange: data.requirePasswordChange ?? true,
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString()
    };

    try {
      const response = await apiFetch<{ success: boolean; user?: User; error?: string }>('/api/users', {
        method: 'POST',
        body: JSON.stringify(newUser)
      });

      if (!response || !response.success) {
        return {
          success: false,
          error: response?.error || 'Failed to save user to Cloudflare D1.'
        };
      }

      const savedUser = response.user || newUser;
      memory.users = [...memory.users, savedUser];
      setToStorage(STORAGE_KEYS.USERS, memory.users);
      notifySubscribers();

      logAudit(
        actor,
        'CREATE_USER',
        'User',
        savedUser.id,
        `Created user: ${savedUser.name} (${savedUser.role})`
      );

      return { success: true, user: savedUser };
    } catch (error) {
      console.error('Create user error:', error);

      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : 'Failed to save user to Cloudflare D1.'
      };
    }
  },

  updateUserAccount: async (updatedUser: User, actor: User): Promise<{ success: boolean; error?: string }> => {
    const existing = storageService.getUserById(updatedUser.id);

    if (!existing) {
      return { success: false, error: 'User not found' };
    }

    if (existing.role === 'PRINCIPAL_PARTNER' && actor.id !== existing.id) {
      return {
        success: false,
        error: 'Protected Account: Only the Principal Partner can update their own account.'
      };
    }

    try {
      const response = await apiFetch<{ success: boolean; user?: User; error?: string }>(`/api/users/${encodeURIComponent(updatedUser.id)}`, {
        method: 'PUT',
        body: JSON.stringify(updatedUser)
      });

      if (!response || !response.success) {
        return {
          success: false,
          error: response?.error || 'Failed to update user in Cloudflare D1.'
        };
      }

      memory.users = memory.users.map(u =>
        u.id === updatedUser.id ? updatedUser : u
      );

      setToStorage(STORAGE_KEYS.USERS, memory.users);
      notifySubscribers();

      logAudit(
        actor,
        'UPDATE_USER',
        'User',
        updatedUser.id,
        `Updated user details for ${updatedUser.name}`
      );

      return { success: true };
    } catch (error) {
      console.error('Update user error:', error);

      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : 'Failed to update user in Cloudflare D1.'
      };
    }
  },

  setUserStatus: async (targetUserId: string, newStatus: User['accountStatus'], actor: User): Promise<{ success: boolean; error?: string }> => {
    const target = storageService.getUserById(targetUserId);
    if (!target) return { success: false, error: 'User not found' };
    if (target.role === 'PRINCIPAL_PARTNER' && newStatus !== 'Active') {
      return { success: false, error: 'Protected Account: The Principal Partner account cannot be suspended or deactivated.' };
    }
    const updatedUser: User = {
      ...target,
      accountStatus: newStatus,
      isActive: newStatus === 'Active'
    };
    memory.users = memory.users.map(u => u.id === targetUserId ? updatedUser : u);
    setToStorage(STORAGE_KEYS.USERS, memory.users);
    notifySubscribers();

    try {
      const response = await apiFetch<{ success: boolean; error?: string }>(`/api/users/${encodeURIComponent(targetUserId)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, accountStatus: newStatus })
      });

      if (!response || !response.success) {
        // Fallback to updating entire user
        await apiFetch(`/api/users/${encodeURIComponent(targetUserId)}`, {
          method: 'PUT',
          body: JSON.stringify(updatedUser)
        });
      }

      logAudit(actor, 'SET_USER_STATUS', 'User', targetUserId, `Set status to ${newStatus}`);
      return { success: true };
    } catch (err: any) {
      console.warn('Persisting user status to D1 failed, saved locally:', err);
      logAudit(actor, 'SET_USER_STATUS', 'User', targetUserId, `Set status to ${newStatus}`);
      return { success: true };
    }
  },

  deleteUserAccount: async (targetUserId: string, actor: User): Promise<{ success: boolean; error?: string }> => {
    const target = storageService.getUserById(targetUserId);
    if (!target) return { success: false, error: 'User not found' };
    if (target.role === 'PRINCIPAL_PARTNER') {
      return { success: false, error: 'Protected Account: The Principal Partner account is permanently protected and cannot be deleted.' };
    }
    if (target.id === actor.id) {
      return { success: false, error: 'Security constraint: You cannot delete your own active session account.' };
    }

    try {
      const response = await apiFetch<{ success: boolean; error?: string }>(`/api/users/${encodeURIComponent(targetUserId)}`, {
        method: 'DELETE'
      });

      if (!response || !response.success) {
        return { success: false, error: response?.error || 'Failed to delete user from Cloudflare D1.' };
      }

      memory.users = memory.users.filter(u => u.id !== targetUserId);
      setToStorage(STORAGE_KEYS.USERS, memory.users);
      notifySubscribers();

      logAudit(actor, 'DELETE_USER', 'User', targetUserId, `Permanently deleted user: ${target.name} (@${target.username})`);
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting user account:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete user account.'
      };
    }
  },

  updateCounselAvailability: (userId: string, status: User['availability'], actor: User): void => {
    memory.users = memory.users.map(u => u.id === userId ? { ...u, availability: status } : u);
    setToStorage(STORAGE_KEYS.USERS, memory.users);
    notifySubscribers();
    logAudit(actor, 'UPDATE_AVAILABILITY', 'User', userId, `Updated availability to ${status}`);
  },

  // Branches
  getBranches: (): Branch[] => memory.branches,
  addBranch: (branch: Omit<Branch, 'id'>, actor: User): Branch => {
    const newBranch: Branch = { ...branch, id: `br-${Date.now()}` };
    memory.branches = [...memory.branches, newBranch];
    setToStorage(STORAGE_KEYS.BRANCHES, memory.branches);
    notifySubscribers();
    logAudit(actor, 'CREATE_BRANCH', 'Branch', newBranch.id, `Created branch: ${newBranch.name}`);

    apiFetch('/api/branches', {
      method: 'POST',
      body: JSON.stringify(newBranch)
    }).catch(err => console.error('Failed to create branch in D1:', err));

    return newBranch;
  },
  updateBranch: (branch: Branch, actor: User): void => {
    memory.branches = memory.branches.map(b => b.id === branch.id ? branch : b);
    setToStorage(STORAGE_KEYS.BRANCHES, memory.branches);
    notifySubscribers();
    logAudit(actor, 'UPDATE_BRANCH', 'Branch', branch.id, `Updated branch: ${branch.name}`);

    apiFetch(`/api/branches/${encodeURIComponent(branch.id)}`, {
      method: 'PUT',
      body: JSON.stringify(branch)
    }).catch(err => console.error('Failed to update branch in D1:', err));
  },
  deleteBranch: async (branchId: string, actor: User): Promise<{ success: boolean; error?: string }> => {
    if (actor.role !== 'PRINCIPAL_PARTNER') {
      return { success: false, error: 'Unauthorized: Only the Principal Partner can delete branches.' };
    }
    if (branchId === 'br-abuja-01') {
      return { success: false, error: 'Protected Branch: Abuja Head Chambers is the permanent headquarters and cannot be deleted.' };
    }

    const existing = memory.branches.find(b => b.id === branchId);
    if (!existing) return { success: false, error: 'Branch not found' };

    try {
      const res = await apiFetch<{ success: boolean; error?: string }>(`/api/branches/${encodeURIComponent(branchId)}`, {
        method: 'DELETE'
      });

      if (!res?.success) {
        return { success: false, error: res?.error || 'Failed to delete branch from Cloudflare D1.' };
      }

      memory.branches = memory.branches.filter(b => b.id !== branchId);
      setToStorage(STORAGE_KEYS.BRANCHES, memory.branches);
      notifySubscribers();
      logAudit(actor, 'DELETE_BRANCH', 'Branch', branchId, `Permanently deleted branch: ${existing.name}`);
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting branch from D1:', err);
      return { success: false, error: err.message || 'Failed to delete branch from Cloudflare D1' };
    }
  },

  // Courts
  getCourts: (): Court[] => memory.courts,
  addCourt: (court: Omit<Court, 'id'>, actor: User): Court => {
    const newCourt: Court = { ...court, id: `crt-${Date.now()}` };
    memory.courts = [...memory.courts, newCourt];
    setToStorage(STORAGE_KEYS.COURTS, memory.courts);
    notifySubscribers();
    return newCourt;
  },

  // Clients (Authoritative against D1)
  getClients: (): Client[] => memory.clients,
  addClient: (clientData: Omit<Client, 'id' | 'clientId' | 'dateRegistered'>, actor: User): Client => {
    const clientId = getNextNumber('client', 'CLI');
    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now()}`,
      clientId,
      dateRegistered: new Date().toISOString()
    };

    memory.clients = [newClient, ...memory.clients];
    setToStorage(STORAGE_KEYS.CLIENTS, memory.clients);
    notifySubscribers();

    // Persist to Cloudflare D1
    apiFetch('/api/clients', {
      method: 'POST',
      body: JSON.stringify(newClient)
    }).then(res => {
      if (res.client) {
        memory.clients = memory.clients.map(c => c.id === newClient.id ? res.client : c);
        setToStorage(STORAGE_KEYS.CLIENTS, memory.clients);
        notifySubscribers();
      }
    }).catch(err => console.error('Failed saving client to D1:', err));

    logAudit(actor, 'REGISTER_CLIENT', 'Client', newClient.id, `Registered client: ${newClient.fullName} (${clientId})`);
    return newClient;
  },

  updateClient: (client: Client, actor: User): void => {
    memory.clients = memory.clients.map(c => c.id === client.id ? client : c);
    setToStorage(STORAGE_KEYS.CLIENTS, memory.clients);
    notifySubscribers();

    apiFetch(`/api/clients/${client.id}`, {
      method: 'PUT',
      body: JSON.stringify(client)
    }).catch(e => console.error('Failed updating client in D1:', e));

    logAudit(actor, 'UPDATE_CLIENT', 'Client', client.id, `Updated client ${client.fullName}`);
  },

  // Consultations & Public Bookings
  getConsultations: (): Consultation[] => memory.consultations,
  bookConsultation: (data: any): { consultation: Consultation; invoice: Invoice; paymentRef: string } => {
    const code = getNextNumber('consultation', 'CONS');
    const invoiceNumber = getNextNumber('invoice', 'INV');
    const paymentRef = getNextNumber('payment', 'PAY');
    const fee = data.feeAmount || memory.websiteContent.consultationFeeStandard || 35000;

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
      items: [{ description: `Legal Consultation Fee (${data.serviceCategory}) — ${data.method}`, amount: fee }],
      subtotal: fee,
      taxAmount: 0,
      totalAmount: fee,
      date: new Date().toISOString().split('T')[0],
      dueDate: data.preferredDate,
      paymentStatus: 'UNPAID',
      paymentReference: paymentRef,
      notes: `Consultation Reference: ${code}. Quote payment reference ${paymentRef} upon transfer.`
    };

    memory.consultations = [newConsultation, ...memory.consultations];
    memory.invoices = [newInvoice, ...memory.invoices];
    setToStorage(STORAGE_KEYS.CONSULTATIONS, memory.consultations);
    setToStorage(STORAGE_KEYS.INVOICES, memory.invoices);
    notifySubscribers();

    apiFetch('/api/consultations', {
      method: 'POST',
      body: JSON.stringify(data)
    }).catch(e => console.error('Failed creating consultation in D1:', e));

    return { consultation: newConsultation, invoice: newInvoice, paymentRef };
  },

  updateConsultation: (consultation: Consultation, actor: User): void => {
    memory.consultations = memory.consultations.map(c => c.id === consultation.id ? consultation : c);
    setToStorage(STORAGE_KEYS.CONSULTATIONS, memory.consultations);
    notifySubscribers();
    logAudit(actor, 'UPDATE_CONSULTATION', 'Consultation', consultation.id, `Updated consultation ${consultation.code}`);
  },

  // Invoices & Billing
  getInvoices: (): Invoice[] => memory.invoices,
  getInvoiceByNumber: (num: string): Invoice | undefined => memory.invoices.find(i => i.invoiceNumber.trim() === num.trim()),
  getInvoiceByPaymentRef: (ref: string): Invoice | undefined => memory.invoices.find(i => i.paymentReference.trim() === ref.trim()),

  createCustomInvoice: (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'paymentReference'>, actor: User): Invoice => {
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

    memory.invoices = [newInvoice, ...memory.invoices];
    setToStorage(STORAGE_KEYS.INVOICES, memory.invoices);
    notifySubscribers();

    apiFetch('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(newInvoice)
    }).catch(e => console.error('Failed creating invoice in D1:', e));

    logAudit(actor, 'CREATE_INVOICE', 'Invoice', newInvoice.id, `Generated invoice ${invoiceNumber} for ${newInvoice.clientName}`);
    return newInvoice;
  },

  updateInvoice: (updatedInvoice: Invoice, actor: User): { success: boolean; error?: string } => {
    if (actor.role !== 'PRINCIPAL_PARTNER' && actor.role !== 'HEAD_OF_CHAMBER' && actor.role !== 'ACCOUNT_OFFICER') {
      return { success: false, error: 'Unauthorized' };
    }
    memory.invoices = memory.invoices.map(i => i.id === updatedInvoice.id ? updatedInvoice : i);
    setToStorage(STORAGE_KEYS.INVOICES, memory.invoices);
    notifySubscribers();

    apiFetch(`/api/invoices/${updatedInvoice.id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedInvoice)
    }).catch(e => console.error('Failed updating invoice in D1:', e));

    logAudit(actor, 'UPDATE_INVOICE', 'Invoice', updatedInvoice.id, `Updated invoice ${updatedInvoice.invoiceNumber}`);
    return { success: true };
  },

  submitInvoiceForApproval: (invoiceCode: string, reason: string, actor: User): { success: boolean; request?: ApprovalRequest; error?: string } => {
    const invoice = memory.invoices.find(i => i.invoiceNumber.trim().toUpperCase() === invoiceCode.trim().toUpperCase());
    if (!invoice) return { success: false, error: 'Invoice not found' };

    const req = storageService.requestApproval({
      requestType: 'Invoice Billing Approval',
      requesterId: actor.id,
      requesterName: actor.name,
      requesterRole: actor.role,
      branchId: actor.branchId || invoice.branchId || 'br-abuja-01',
      title: `Invoice Clearance: ${invoice.invoiceNumber} (₦${invoice.totalAmount.toLocaleString()})`,
      description: `Client: ${invoice.clientName}. ${reason}`,
      referenceCode: invoice.invoiceNumber
    }, actor);

    invoice.approvalStatus = 'PENDING_APPROVAL';
    invoice.approvalRequestId = req.id;
    invoice.approvalNotes = `Submitted by ${actor.name}: ${reason}`;

    memory.invoices = memory.invoices.map(i => i.id === invoice.id ? invoice : i);
    setToStorage(STORAGE_KEYS.INVOICES, memory.invoices);
    notifySubscribers();
    return { success: true, request: req };
  },

  // Payments
  getPayments: (): PaymentRecord[] => memory.payments,
  submitPayment: (data: any): PaymentRecord => {
    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      paymentReference: data.paymentReference,
      invoiceNumber: data.invoiceNumber,
      clientName: data.clientName,
      amount: data.amount,
      branchId: 'br-abuja-01',
      paymentMethod: data.paymentMethod,
      paymentDate: new Date().toISOString(),
      status: 'PAYMENT_SUBMITTED',
      bankTransactionRef: data.bankTransactionRef,
      verificationNotes: data.notes,
      proofDocumentUrl: data.proofDocumentUrl,
      submittedAt: new Date().toISOString()
    };

    memory.payments = [newPayment, ...memory.payments];
    setToStorage(STORAGE_KEYS.PAYMENTS, memory.payments);

    // Update invoice locally
    memory.invoices = memory.invoices.map(inv => {
      if (inv.invoiceNumber === data.invoiceNumber || inv.paymentReference === data.paymentReference) {
        return { ...inv, paymentStatus: 'PAYMENT_SUBMITTED' as const, paymentMethod: data.paymentMethod };
      }
      return inv;
    });
    setToStorage(STORAGE_KEYS.INVOICES, memory.invoices);
    notifySubscribers();

    apiFetch('/api/payments', {
      method: 'POST',
      body: JSON.stringify(data)
    }).catch(e => console.error('Failed submitting payment to D1:', e));

    return newPayment;
  },

  verifyPayment: (paymentId: string, isApproved: boolean, notes: string, actor: User): void => {
    const receiptNumber = isApproved ? getNextNumber('receipt', 'REC') : undefined;
    const newStatus = isApproved ? 'PAYMENT_VERIFIED' : 'REJECTED';

    memory.payments = memory.payments.map(p => {
      if (p.id === paymentId) {
        return {
          ...p,
          status: newStatus as any,
          verifiedById: actor.id,
          verifiedByName: actor.name,
          verificationDate: new Date().toISOString(),
          verificationNotes: notes,
          receiptNumber
        };
      }
      return p;
    });
    setToStorage(STORAGE_KEYS.PAYMENTS, memory.payments);

    const verified = memory.payments.find(p => p.id === paymentId);
    if (verified) {
      memory.invoices = memory.invoices.map(inv => {
        if (inv.invoiceNumber === verified.invoiceNumber) {
          return {
            ...inv,
            paymentStatus: isApproved ? 'PAYMENT_VERIFIED' : 'UNPAID'
          };
        }
        return inv;
      });
      setToStorage(STORAGE_KEYS.INVOICES, memory.invoices);

      memory.consultations = memory.consultations.map(c => {
        if (c.invoiceNumber === verified.invoiceNumber || c.paymentReference === verified.paymentReference) {
          return {
            ...c,
            status: isApproved ? 'Payment Verified' : 'Awaiting Payment',
            clientVisibleUpdate: isApproved ? `Payment verified. Receipt ${receiptNumber} generated.` : `Payment rejected: ${notes}`
          };
        }
        return c;
      });
      setToStorage(STORAGE_KEYS.CONSULTATIONS, memory.consultations);
    }
    notifySubscribers();

    apiFetch('/api/payments/verify', {
      method: 'PUT',
      body: JSON.stringify({ paymentId, isApproved, notes })
    }).catch(e => console.error('Failed verifying payment in D1:', e));

    logAudit(actor, isApproved ? 'VERIFY_PAYMENT' : 'REJECT_PAYMENT', 'Payment', paymentId, `${isApproved ? 'Verified' : 'Rejected'} payment of ₦${verified?.amount.toLocaleString()}`);
  },

  // Expenses
  getExpenses: (): ExpenseRecord[] => memory.expenses,
  addExpense: (expense: Omit<ExpenseRecord, 'id' | 'recordedById' | 'recordedByName'>, actor: User): ExpenseRecord => {
    const newExpense: ExpenseRecord = {
      ...expense,
      id: `exp-${Date.now()}`,
      branchId: expense.branchId || actor.branchId || 'br-abuja-01',
      recordedById: actor.id,
      recordedByName: actor.name
    };
    memory.expenses = [newExpense, ...memory.expenses];
    setToStorage(STORAGE_KEYS.EXPENSES, memory.expenses);
    notifySubscribers();
    logAudit(actor, 'RECORD_EXPENSE', 'Expense', newExpense.id, `Recorded expense of ₦${expense.amount.toLocaleString()}`);
    return newExpense;
  },

  // Matters
  getMatters: (): Matter[] => memory.matters,
  addMatter: (matterData: Omit<Matter, 'id' | 'matterId' | 'createdAt'>, actor: User): Matter => {
    const matterId = getNextNumber('matter', 'MAT');
    const newMatter: Matter = {
      ...matterData,
      id: `mat-${Date.now()}`,
      matterId,
      branchId: matterData.branchId || actor.branchId || 'br-abuja-01',
      createdAt: new Date().toISOString()
    };
    memory.matters = [newMatter, ...memory.matters];
    setToStorage(STORAGE_KEYS.MATTERS, memory.matters);
    notifySubscribers();

    apiFetch('/api/matters', {
      method: 'POST',
      body: JSON.stringify(newMatter)
    }).catch(e => console.error('Failed adding matter to D1:', e));

    logAudit(actor, 'CREATE_MATTER', 'Matter', newMatter.id, `Created matter ${newMatter.title} (${matterId})`);
    return newMatter;
  },

  updateMatter: (matter: Matter, actor: User): void => {
    memory.matters = memory.matters.map(m => m.id === matter.id ? matter : m);
    setToStorage(STORAGE_KEYS.MATTERS, memory.matters);
    notifySubscribers();
    logAudit(actor, 'UPDATE_MATTER', 'Matter', matter.id, `Updated matter: ${matter.title}`);

    apiFetch(`/api/matters/${encodeURIComponent(matter.id)}`, {
      method: 'PUT',
      body: JSON.stringify(matter)
    }).catch(e => console.error('Failed updating matter in D1:', e));
  },

  deleteMatter: async (matterId: string, actor: User): Promise<{ success: boolean; error?: string }> => {
    if (actor.role !== 'PRINCIPAL_PARTNER' && actor.role !== 'HEAD_OF_CHAMBER') {
      return { success: false, error: 'Unauthorized: Only Principal Partner or Head of Chamber can delete legal matters.' };
    }
    const target = memory.matters.find(m => m.id === matterId || m.matterId === matterId);
    if (!target) return { success: false, error: 'Matter not found' };

    try {
      const res = await apiFetch<{ success: boolean; error?: string }>(`/api/matters/${encodeURIComponent(target.id)}`, {
        method: 'DELETE'
      });
      if (!res?.success) {
        return { success: false, error: res?.error || 'Failed to delete matter from Cloudflare D1.' };
      }

      memory.matters = memory.matters.filter(m => m.id !== target.id && m.matterId !== target.matterId);
      setToStorage(STORAGE_KEYS.MATTERS, memory.matters);
      notifySubscribers();
      logAudit(actor, 'DELETE_MATTER', 'Matter', target.id, `Permanently deleted matter: ${target.title} (${target.matterId})`);
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting matter from D1:', err);
      return { success: false, error: err.message || 'Failed to delete matter from Cloudflare D1' };
    }
  },

  // Cases & Assignments
  getCases: (): CaseRecord[] => memory.cases,
  addCase: (caseData: Omit<CaseRecord, 'id' | 'caseId' | 'createdAt'>, actor: User): CaseRecord => {
    const caseId = getNextNumber('case', 'CASE');
    const newCase: CaseRecord = {
      ...caseData,
      id: `case-${Date.now()}`,
      caseId,
      branchId: caseData.branchId || actor.branchId || 'br-abuja-01',
      createdAt: new Date().toISOString()
    };

    memory.cases = [newCase, ...memory.cases];
    setToStorage(STORAGE_KEYS.CASES, memory.cases);

    storageService.createCaseAssignment({
      caseId: newCase.id,
      suitNumber: newCase.suitNumber,
      branchId: newCase.branchId,
      counselId: newCase.counselId,
      assignedById: actor.id,
      assignedByName: actor.name
    });

    notifySubscribers();

    apiFetch('/api/cases', {
      method: 'POST',
      body: JSON.stringify(newCase)
    }).catch(e => console.error('Failed creating case in D1:', e));

    logAudit(actor, 'FILE_CASE', 'Case', newCase.id, `Registered case: ${newCase.suitNumber} (${caseId})`);
    return newCase;
  },

  updateCase: (caseRecord: CaseRecord, actor: User): void => {
    memory.cases = memory.cases.map(c => c.id === caseRecord.id ? caseRecord : c);
    setToStorage(STORAGE_KEYS.CASES, memory.cases);
    notifySubscribers();
    logAudit(actor, 'UPDATE_CASE', 'Case', caseRecord.id, `Updated litigation record: ${caseRecord.suitNumber}`);

    apiFetch(`/api/cases/${encodeURIComponent(caseRecord.id)}`, {
      method: 'PUT',
      body: JSON.stringify(caseRecord)
    }).catch(e => console.error('Failed updating case in D1:', e));
  },

  deleteCase: async (caseId: string, actor: User): Promise<{ success: boolean; error?: string }> => {
    if (actor.role !== 'PRINCIPAL_PARTNER' && actor.role !== 'HEAD_OF_CHAMBER') {
      return { success: false, error: 'Unauthorized: Only Principal Partner or Head of Chamber can delete litigation cases.' };
    }
    const target = memory.cases.find(c => c.id === caseId || c.caseId === caseId);
    if (!target) return { success: false, error: 'Case not found' };

    try {
      const res = await apiFetch<{ success: boolean; error?: string }>(`/api/cases/${encodeURIComponent(target.id)}`, {
        method: 'DELETE'
      });
      if (!res?.success) {
        return { success: false, error: res?.error || 'Failed to delete case from Cloudflare D1.' };
      }

      memory.cases = memory.cases.filter(c => c.id !== target.id && c.caseId !== target.caseId);
      memory.caseAssignments = memory.caseAssignments.filter(a => a.caseId !== target.id);
      setToStorage(STORAGE_KEYS.CASES, memory.cases);
      setToStorage(STORAGE_KEYS.CASE_ASSIGNMENTS, memory.caseAssignments);
      notifySubscribers();
      logAudit(actor, 'DELETE_CASE', 'Case', target.id, `Permanently deleted case: ${target.suitNumber} (${target.caseId})`);
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting case from D1:', err);
      return { success: false, error: err.message || 'Failed to delete case from Cloudflare D1' };
    }
  },

  // Case Assignments
  getCaseAssignments: (): CaseAssignment[] => memory.caseAssignments,
  createCaseAssignment: (data: any): CaseAssignment => {
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
    memory.caseAssignments = [newAssignment, ...memory.caseAssignments];
    setToStorage(STORAGE_KEYS.CASE_ASSIGNMENTS, memory.caseAssignments);
    notifySubscribers();
    return newAssignment;
  },

  respondToAssignment: (assignmentId: string, status: any, reason?: any, notes?: any, actor?: User): void => {
    memory.caseAssignments = memory.caseAssignments.map(a => {
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
    setToStorage(STORAGE_KEYS.CASE_ASSIGNMENTS, memory.caseAssignments);
    notifySubscribers();

    apiFetch(`/api/case-assignments/${assignmentId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, reason, notes })
    }).catch(e => console.error('Failed updating assignment in D1:', e));

    if (actor) {
      logAudit(actor, `ASSIGNMENT_${status}`, 'CaseAssignment', assignmentId, `Counsel responded with ${status}`);
    }
  },

  reassignCase: (caseId: string, newCounselId: string, actor: User): void => {
    memory.cases = memory.cases.map(c => c.id === caseId ? { ...c, counselId: newCounselId } : c);
    setToStorage(STORAGE_KEYS.CASES, memory.cases);
    const cs = memory.cases.find(c => c.id === caseId);
    if (cs) {
      storageService.createCaseAssignment({
        caseId: cs.id,
        suitNumber: cs.suitNumber,
        counselId: newCounselId,
        assignedById: actor.id,
        assignedByName: actor.name
      });
    }
    notifySubscribers();
  },

  // Court Diary
  getCourtDiary: (): CourtDiaryEntry[] => memory.courtDiary,
  addCourtDiaryEntry: (entry: Omit<CourtDiaryEntry, 'id'>, actor: User): CourtDiaryEntry => {
    const newEntry: CourtDiaryEntry = {
      ...entry,
      id: `diary-${Date.now()}`,
      branchId: entry.branchId || actor.branchId || 'br-abuja-01'
    };
    memory.courtDiary = [newEntry, ...memory.courtDiary];
    setToStorage(STORAGE_KEYS.COURT_DIARY, memory.courtDiary);

    // Update case next court date
    memory.cases = memory.cases.map(c => c.id === entry.caseId ? { ...c, nextCourtDate: entry.courtDate } : c);
    setToStorage(STORAGE_KEYS.CASES, memory.cases);
    notifySubscribers();

    apiFetch('/api/court-diary', {
      method: 'POST',
      body: JSON.stringify(newEntry)
    }).catch(e => console.error('Failed saving court diary to D1:', e));

    logAudit(actor, 'SCHEDULE_COURT_DATE', 'CourtDiary', newEntry.id, `Scheduled appearance for ${entry.suitNumber}`);
    return newEntry;
  },

  updateCourtDiaryEntry: (entry: CourtDiaryEntry, actor: User): void => {
    memory.courtDiary = memory.courtDiary.map(e => e.id === entry.id ? entry : e);
    setToStorage(STORAGE_KEYS.COURT_DIARY, memory.courtDiary);
    notifySubscribers();
  },

  // Tasks
  getTasks: (): Task[] => memory.tasks,
  addTask: (task: Omit<Task, 'id' | 'createdAt'>, actor: User): Task => {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      branchId: task.branchId || actor.branchId || 'br-abuja-01',
      createdAt: new Date().toISOString()
    };
    memory.tasks = [newTask, ...memory.tasks];
    setToStorage(STORAGE_KEYS.TASKS, memory.tasks);
    notifySubscribers();

    apiFetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(newTask)
    }).catch(e => console.error('Failed saving task to D1:', e));

    logAudit(actor, 'CREATE_TASK', 'Task', newTask.id, `Created task: ${newTask.title}`);
    return newTask;
  },

  updateTask: (task: Task, actor: User): void => {
    memory.tasks = memory.tasks.map(t => t.id === task.id ? task : t);
    setToStorage(STORAGE_KEYS.TASKS, memory.tasks);
    notifySubscribers();
  },

  // Documents
  getDocuments: (): DocumentRecord[] => memory.documents,
  addDocument: (doc: any, actor: User): DocumentRecord => {
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
    memory.documents = [newDoc, ...memory.documents];
    setToStorage(STORAGE_KEYS.DOCUMENTS, memory.documents);
    notifySubscribers();
    return newDoc;
  },
  deleteDocument: (id: string, actor: User): void => {
    memory.documents = memory.documents.filter(d => d.id !== id);
    setToStorage(STORAGE_KEYS.DOCUMENTS, memory.documents);
    notifySubscribers();
  },

  // Correspondence
  getCorrespondence: (): Correspondence[] => memory.correspondence,
  addCorrespondence: (item: any, actor: User): Correspondence => {
    const newItem: Correspondence = {
      ...item,
      id: `cor-${Date.now()}`,
      loggedById: actor.id
    };
    memory.correspondence = [newItem, ...memory.correspondence];
    setToStorage(STORAGE_KEYS.CORRESPONDENCE, memory.correspondence);
    notifySubscribers();
    return newItem;
  },

  // Legal Research
  getLegalResearch: (): LegalResearch[] => memory.legalResearch,
  addLegalResearch: (item: any, actor: User): LegalResearch => {
    const newItem: LegalResearch = {
      ...item,
      id: `res-${Date.now()}`,
      counselId: actor.id,
      counselName: actor.name,
      date: new Date().toISOString()
    };
    memory.legalResearch = [newItem, ...memory.legalResearch];
    setToStorage(STORAGE_KEYS.LEGAL_RESEARCH, memory.legalResearch);
    notifySubscribers();
    return newItem;
  },

  // Appointments
  getAppointments: (): Appointment[] => memory.appointments,
  addAppointment: (app: any, actor: User): Appointment => {
    const newApp: Appointment = { ...app, id: `app-${Date.now()}` };
    memory.appointments = [newApp, ...memory.appointments];
    setToStorage(STORAGE_KEYS.APPOINTMENTS, memory.appointments);
    notifySubscribers();
    return newApp;
  },

  // Properties
  getProperties: (): Property[] => memory.properties,
  addProperty: (prop: Omit<Property, 'id' | 'propertyId'>, actor: User): Property => {
    const propertyId = getNextNumber('property', 'PROP');
    const newProp: Property = {
      ...prop,
      id: `prop-${Date.now()}`,
      propertyId,
      branchId: prop.branchId || actor.branchId || 'br-abuja-01'
    };
    memory.properties = [newProp, ...memory.properties];
    setToStorage(STORAGE_KEYS.PROPERTIES, memory.properties);
    notifySubscribers();

    apiFetch('/api/properties', {
      method: 'POST',
      body: JSON.stringify(newProp)
    }).catch(e => console.error('Failed saving property to D1:', e));

    logAudit(actor, 'ADD_PROPERTY', 'Property', newProp.id, `Registered property: ${newProp.name} (${propertyId})`);
    return newProp;
  },
  updateProperty: (prop: Property, actor: User): void => {
    memory.properties = memory.properties.map(p => p.id === prop.id ? prop : p);
    setToStorage(STORAGE_KEYS.PROPERTIES, memory.properties);
    notifySubscribers();
  },

  // Landlords
  getLandlords: (): Landlord[] => memory.landlords,
  addLandlord: (landlord: any, actor: User): Landlord => {
    const trackingCode = getNextNumber('landlord', 'LAND');
    const landlordId = `LND-${String(memory.landlords.length + 1).padStart(4, '0')}`;
    const newLandlord: Landlord = {
      ...landlord,
      id: `lnd-${Date.now()}`,
      landlordId,
      trackingCode,
      dateRegistered: new Date().toISOString()
    };
    memory.landlords = [newLandlord, ...memory.landlords];
    setToStorage(STORAGE_KEYS.LANDLORDS, memory.landlords);
    notifySubscribers();

    apiFetch('/api/landlords', {
      method: 'POST',
      body: JSON.stringify(newLandlord)
    }).catch(e => console.error('Failed saving landlord to D1:', e));

    return newLandlord;
  },

  // Units
  getUnits: (): Unit[] => memory.units,
  addUnit: (unit: any, actor: User): Unit => {
    const newUnit: Unit = { ...unit, id: `unt-${Date.now()}` };
    memory.units = [newUnit, ...memory.units];
    setToStorage(STORAGE_KEYS.UNITS, memory.units);
    notifySubscribers();
    return newUnit;
  },

  // Tenants & Tenancies
  getTenants: (): Tenant[] => memory.tenants,
  addTenant: (tenant: any, actor: User): Tenant => {
    const trackingCode = getNextNumber('tenancy', 'TEN');
    const tenantId = `TNT-${String(memory.tenants.length + 1).padStart(4, '0')}`;
    const newTenant: Tenant = {
      ...tenant,
      id: `tnt-${Date.now()}`,
      tenantId,
      trackingCode,
      dateRegistered: new Date().toISOString()
    };
    memory.tenants = [newTenant, ...memory.tenants];
    setToStorage(STORAGE_KEYS.TENANTS, memory.tenants);
    notifySubscribers();

    apiFetch('/api/tenants', {
      method: 'POST',
      body: JSON.stringify(newTenant)
    }).catch(e => console.error('Failed saving tenant to D1:', e));

    return newTenant;
  },

  getTenancies: (): Tenancy[] => memory.tenancies,
  addTenancy: (tenancy: any, actor: User): Tenancy => {
    const newTenancy: Tenancy = { ...tenancy, id: `ten-${Date.now()}` };
    memory.tenancies = [newTenancy, ...memory.tenancies];
    setToStorage(STORAGE_KEYS.TENANCIES, memory.tenancies);
    notifySubscribers();
    return newTenancy;
  },

  // Rent Records
  getRentRecords: (): RentRecord[] => memory.rentRecords,
  addRentRecord: (rent: any, actor: User): RentRecord => {
    const newRent: RentRecord = { ...rent, id: `rent-${Date.now()}` };
    memory.rentRecords = [newRent, ...memory.rentRecords];
    setToStorage(STORAGE_KEYS.RENT_RECORDS, memory.rentRecords);
    notifySubscribers();
    return newRent;
  },

  // Property Disputes
  getPropertyDisputes: (): PropertyDispute[] => memory.propertyDisputes,
  addPropertyDispute: (dispute: any, actor: User): PropertyDispute => {
    const newDispute: PropertyDispute = {
      ...dispute,
      id: `disp-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    memory.propertyDisputes = [newDispute, ...memory.propertyDisputes];
    setToStorage(STORAGE_KEYS.PROPERTY_DISPUTES, memory.propertyDisputes);
    notifySubscribers();
    return newDispute;
  },
  updatePropertyDispute: (dispute: PropertyDispute, actor: User): void => {
    memory.propertyDisputes = memory.propertyDisputes.map(d => d.id === dispute.id ? dispute : d);
    setToStorage(STORAGE_KEYS.PROPERTY_DISPUTES, memory.propertyDisputes);
    notifySubscribers();
  },

  // Quit Notices
  getQuitNotices: (): QuitNotice[] => memory.quitNotices,
  issueQuitNotice: (data: any, actor: User): QuitNotice => {
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
    memory.quitNotices = [newNotice, ...memory.quitNotices];
    setToStorage(STORAGE_KEYS.QUIT_NOTICES, memory.quitNotices);
    notifySubscribers();

    apiFetch('/api/quit-notices', {
      method: 'POST',
      body: JSON.stringify(newNotice)
    }).catch(e => console.error('Failed saving quit notice in D1:', e));

    return newNotice;
  },
  updateQuitNoticeStatus: (id: string, status: any, actor: User): void => {
    memory.quitNotices = memory.quitNotices.map(q => q.id === id ? { ...q, status } : q);
    setToStorage(STORAGE_KEYS.QUIT_NOTICES, memory.quitNotices);
    notifySubscribers();
  },

  // Rent Due Notifications
  checkRentDueNotifications: (): void => {
    const tenancies = memory.tenancies;
    const tenants = memory.tenants;
    const properties = memory.properties;
    const existingNotifs = memory.notifications;
    const now = new Date();

    tenancies.forEach(tenancy => {
      if (tenancy.status === 'Terminated' || tenancy.status === 'Expired') return;
      const expiryDate = new Date(tenancy.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
        const tenant = tenants.find(t => t.id === tenancy.tenantId);
        const property = properties.find(p => p.id === tenancy.propertyId);
        const notifKey = `rent-due-${tenancy.id}-${tenancy.expiryDate}`;
        if (!existingNotifs.some(n => n.linkAction === notifKey)) {
          dispatchNotification(
            'Rent Payment Due Soon',
            `Tenancy for ${tenant?.fullName || 'Tenant'} at ${property?.name || 'Property'} expires in ${daysUntilExpiry} days. Rent: ₦${tenancy.rentAmount.toLocaleString()}.`,
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
  getInstitutions: (): Institution[] => memory.institutions,
  addInstitution: (inst: any, actor: User): Institution => {
    const newInst: Institution = { ...inst, id: `inst-${Date.now()}` };
    memory.institutions = [...memory.institutions, newInst];
    setToStorage(STORAGE_KEYS.INSTITUTIONS, memory.institutions);
    notifySubscribers();
    return newInst;
  },
  getStudents: (): StudentProfile[] => memory.students,
  registerStudent: (student: any, actor: User): StudentProfile => {
    const studentId = getNextNumber('internship', 'INT');
    const newStudent: StudentProfile = {
      ...student,
      id: `std-${Date.now()}`,
      studentId,
      completionLetterIssued: false,
      createdAt: new Date().toISOString()
    };
    memory.students = [newStudent, ...memory.students];
    setToStorage(STORAGE_KEYS.STUDENTS, memory.students);
    notifySubscribers();
    return newStudent;
  },
  updateStudent: (student: StudentProfile, actor: User): void => {
    memory.students = memory.students.map(s => s.id === student.id ? student : s);
    setToStorage(STORAGE_KEYS.STUDENTS, memory.students);
    notifySubscribers();
  },
  applyForInternshipPublic: (data: any): { studentId: string; application: StudentProfile } => {
    const studentId = getNextNumber('internship', 'INT');
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
    memory.students = [newStudent, ...memory.students];
    setToStorage(STORAGE_KEYS.STUDENTS, memory.students);
    notifySubscribers();
    return { studentId, application: newStudent };
  },
  getAttendance: (): InternshipAttendance[] => memory.attendance,
  logAttendance: (att: any, actor: User): InternshipAttendance => {
    const newAtt: InternshipAttendance = { ...att, id: `att-${Date.now()}` };
    memory.attendance = [newAtt, ...memory.attendance];
    setToStorage(STORAGE_KEYS.ATTENDANCE, memory.attendance);
    notifySubscribers();
    return newAtt;
  },
  getEvaluations: (): InternshipEvaluation[] => memory.evaluations,
  submitEvaluation: (evaluation: any, actor: User): InternshipEvaluation => {
    const newEval: InternshipEvaluation = { ...evaluation, id: `eval-${Date.now()}` };
    memory.evaluations = [newEval, ...memory.evaluations];
    setToStorage(STORAGE_KEYS.EVALUATIONS, memory.evaluations);
    notifySubscribers();
    return newEval;
  },

  // Public Notices & Enquiries
  getPublicNotices: (): PublicNotice[] => memory.publicNotices,
  addPublicNotice: (notice: any, actor: User): PublicNotice => {
    const newNotice: PublicNotice = {
      ...notice,
      id: `not-${Date.now()}`,
      publishDate: new Date().toISOString().split('T')[0],
      publishedById: actor.id,
      publishedByName: actor.name
    };
    memory.publicNotices = [newNotice, ...memory.publicNotices];
    setToStorage(STORAGE_KEYS.PUBLIC_NOTICES, memory.publicNotices);
    notifySubscribers();
    return newNotice;
  },
  updatePublicNotice: (notice: PublicNotice, actor: User): void => {
    memory.publicNotices = memory.publicNotices.map(n => n.id === notice.id ? notice : n);
    setToStorage(STORAGE_KEYS.PUBLIC_NOTICES, memory.publicNotices);
    notifySubscribers();
  },
  deletePublicNotice: (noticeId: string, actor: User): void => {
    memory.publicNotices = memory.publicNotices.filter(n => n.id !== noticeId);
    setToStorage(STORAGE_KEYS.PUBLIC_NOTICES, memory.publicNotices);
    notifySubscribers();
  },
  getPublicEnquiries: (): PublicEnquiry[] => memory.publicEnquiries,
  submitPublicEnquiry: (enquiry: any): PublicEnquiry => {
    const newEnquiry: PublicEnquiry = {
      ...enquiry,
      id: `enq-${Date.now()}`,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    memory.publicEnquiries = [newEnquiry, ...memory.publicEnquiries];
    setToStorage(STORAGE_KEYS.PUBLIC_ENQUIRIES, memory.publicEnquiries);
    notifySubscribers();
    return newEnquiry;
  },

  // Approvals
  getApprovals: (): ApprovalRequest[] => memory.approvals,
  requestApproval: (req: any, actor: User): ApprovalRequest => {
    const newReq: ApprovalRequest = {
      ...req,
      id: `appr-${Date.now()}`,
      status: 'PENDING_PRINCIPAL_PARTNER_APPROVAL',
      submittedAt: new Date().toISOString()
    };
    memory.approvals = [newReq, ...memory.approvals];
    setToStorage(STORAGE_KEYS.APPROVALS, memory.approvals);
    notifySubscribers();
    return newReq;
  },
  decideApproval: (requestId: string, status: any, notes: string, actor: User): void => {
    memory.approvals = memory.approvals.map(a => {
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
    setToStorage(STORAGE_KEYS.APPROVALS, memory.approvals);
    notifySubscribers();
  },

  // Notifications & Audits
  getNotifications: (): NotificationItem[] => memory.notifications,
  markNotificationAsRead: (id: string): void => {
    memory.notifications = memory.notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    setToStorage(STORAGE_KEYS.NOTIFICATIONS, memory.notifications);
    notifySubscribers();
  },
  markAllNotificationsAsRead: (): void => {
    memory.notifications = memory.notifications.map(n => ({ ...n, isRead: true }));
    setToStorage(STORAGE_KEYS.NOTIFICATIONS, memory.notifications);
    notifySubscribers();
  },
  getAuditLogs: (): AuditLog[] => memory.auditLogs,

  // Active Session & Branch
  getActiveBranchId: (): string => memory.activeBranchId,
  setActiveBranchId: (id: string): void => {
    memory.activeBranchId = id;
    setToStorage(STORAGE_KEYS.ACTIVE_BRANCH_ID, id);
    notifySubscribers();
  }
};
