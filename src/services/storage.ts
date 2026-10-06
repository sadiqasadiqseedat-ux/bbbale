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
  UserRole
} from '../types';

// INITIAL AUTHORIZED PERSONNEL - THE 5 ROLES
const INITIAL_USERS: User[] = [
  {
    id: 'usr-principal-01',
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
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-hoc-01',
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
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-admin-01',
    name: 'Fatima Garba, B.Sc, CIPM',
    email: 'secretary@bbbalechambers.ng',
    phone: '+234 809 555 1212',
    role: 'ADMINISTRATOR_SECRETARY',
    branchId: 'br-abuja-01',
    title: 'Chambers Administrator & Legal Secretary',
    practiceAreas: ['Chambers Operations', 'Court Filings Logistics', 'Client Intake Registry'],
    bio: 'Oversees chambers intake, court fixture registries, appointment schedules, and student placement logistics.',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=600',
    availability: 'AVAILABLE',
    isPubliclyVisible: false,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-account-01',
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
    isPubliclyVisible: false,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-counsel-01',
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

// INITIAL PARTNER INSTITUTIONS FOR LAW STUDENTS
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

// STORAGE KEYS
const STORAGE_KEYS = {
  USERS: 'bb_users_v1',
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
  CURRENT_USER_ID: 'bb_current_user_id_v1',
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
  user: { id: string; name: string; role: UserRole },
  action: string,
  entity: string,
  entityId: string,
  details: string
): void {
  const logs = getFromStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  const newLog: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    userId: user.id,
    userName: user.name,
    userRole: user.role,
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
export function initializeStorage(): void {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
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
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, JSON.stringify('usr-principal-01'));
  }
}

// STORE REPOSITORY API
export const storageService = {
  // Users & Staff
  getUsers: (): User[] => getFromStorage<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS),
  getUserById: (id: string): User | undefined => {
    return storageService.getUsers().find(u => u.id === id);
  },
  updateUser: (user: User, actor: User): void => {
    const users = storageService.getUsers().map(u => u.id === user.id ? user : u);
    setToStorage(STORAGE_KEYS.USERS, users);
    logAudit(actor, 'UPDATE_USER', 'User', user.id, `Updated user profile: ${user.name}`);
  },
  updateCounselAvailability: (userId: string, availability: User['availability'], actor: User): void => {
    const users = storageService.getUsers().map(u => {
      if (u.id === userId) {
        return { ...u, availability };
      }
      return u;
    });
    setToStorage(STORAGE_KEYS.USERS, users);
    logAudit(actor, 'UPDATE_AVAILABILITY', 'Counsel', userId, `Changed status to ${availability}`);
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
    return newBranch;
  },
  updateBranch: (branch: Branch, actor: User): void => {
    const branches = storageService.getBranches().map(b => b.id === branch.id ? branch : b);
    setToStorage(STORAGE_KEYS.BRANCHES, branches);
    logAudit(actor, 'UPDATE_BRANCH', 'Branch', branch.id, `Updated branch: ${branch.name}`);
  },

  // Courts
  getCourts: (): Court[] => getFromStorage<Court[]>(STORAGE_KEYS.COURTS, INITIAL_COURTS),
  addCourt: (court: Omit<Court, 'id'>, actor: User): Court => {
    const courts = storageService.getCourts();
    const newCourt: Court = { ...court, id: `crt-${Date.now()}` };
    setToStorage(STORAGE_KEYS.COURTS, [...courts, newCourt]);
    logAudit(actor, 'ADD_COURT', 'Court', newCourt.id, `Added court: ${newCourt.name}`);
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
    return newClient;
  },
  updateClient: (client: Client, actor: User): void => {
    const clients = storageService.getClients().map(c => c.id === client.id ? client : c);
    setToStorage(STORAGE_KEYS.CLIENTS, clients);
    logAudit(actor, 'UPDATE_CLIENT', 'Client', client.id, `Updated client ${client.fullName}`);
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
    const fee = data.feeAmount || 35000; // Standard initial consultation fee in Naira

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
    
    // Save invoice
    const invoices = storageService.getInvoices();
    setToStorage(STORAGE_KEYS.INVOICES, [newInvoice, ...invoices]);

    // Dispatch internal notification
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

    return { consultation: newConsultation, invoice: newInvoice, paymentRef };
  },
  updateConsultation: (consultation: Consultation, actor: User): void => {
    const list = storageService.getConsultations().map(c => c.id === consultation.id ? consultation : c);
    setToStorage(STORAGE_KEYS.CONSULTATIONS, list);
    logAudit(actor, 'UPDATE_CONSULTATION', 'Consultation', consultation.id, `Updated consultation ${consultation.code}`);
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
      paymentReference: paymentRef
    };
    setToStorage(STORAGE_KEYS.INVOICES, [newInvoice, ...invoices]);
    logAudit(actor, 'CREATE_INVOICE', 'Invoice', newInvoice.id, `Generated invoice ${invoiceNumber} for ${newInvoice.clientName} (₦${newInvoice.totalAmount.toLocaleString()})`);
    return newInvoice;
  },
  submitPayment: (data: {
    paymentReference: string;
    invoiceNumber: string;
    clientName: string;
    amount: number;
    paymentMethod: PaymentRecord['paymentMethod'];
    bankTransactionRef?: string;
    notes?: string;
  }): PaymentRecord => {
    const payments = storageService.getPayments();
    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      paymentReference: data.paymentReference,
      invoiceNumber: data.invoiceNumber,
      clientName: data.clientName,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      paymentDate: new Date().toISOString(),
      status: 'PAYMENT_SUBMITTED',
      bankTransactionRef: data.bankTransactionRef,
      verificationNotes: data.notes,
      submittedAt: new Date().toISOString()
    };
    setToStorage(STORAGE_KEYS.PAYMENTS, [newPayment, ...payments]);

    // Update invoice status
    const invoices = storageService.getInvoices().map(inv => {
      if (inv.invoiceNumber === data.invoiceNumber || inv.paymentReference === data.paymentReference) {
        return { ...inv, paymentStatus: 'PAYMENT_SUBMITTED' as const, paymentMethod: data.paymentMethod };
      }
      return inv;
    });
    setToStorage(STORAGE_KEYS.INVOICES, invoices);

    // Update consultation status if linked
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
      // Update invoice
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

      // Update consultation
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
      recordedById: actor.id,
      recordedByName: actor.name
    };
    setToStorage(STORAGE_KEYS.EXPENSES, [newExpense, ...expenses]);
    logAudit(actor, 'RECORD_EXPENSE', 'Expense', newExpense.id, `Recorded ${expense.accountType} expense: ₦${expense.amount.toLocaleString()} - ${expense.description}`);
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
      createdAt: new Date().toISOString()
    };
    setToStorage(STORAGE_KEYS.MATTERS, [newMatter, ...matters]);
    logAudit(actor, 'CREATE_MATTER', 'Matter', newMatter.id, `Created matter ${newMatter.title} (${matterId})`);
    dispatchNotification('New Legal Matter Opened', `Matter ${matterId} opened: ${newMatter.title}`, 'info');
    return newMatter;
  },
  updateMatter: (matter: Matter, actor: User): void => {
    const list = storageService.getMatters().map(m => m.id === matter.id ? matter : m);
    setToStorage(STORAGE_KEYS.MATTERS, list);
    logAudit(actor, 'UPDATE_MATTER', 'Matter', matter.id, `Updated matter: ${matter.title}`);
  },

  // Cases & Assignments
  getCases: (): CaseRecord[] => getFromStorage<CaseRecord[]>(STORAGE_KEYS.CASES, []),
  addCase: (caseData: Omit<CaseRecord, 'id' | 'caseId' | 'createdAt'>, actor: User): CaseRecord => {
    const cases = storageService.getCases();
    const caseId = getNextNumber('case', 'CASE');
    const newCase: CaseRecord = {
      ...caseData,
      id: `case-${Date.now()}`,
      caseId,
      createdAt: new Date().toISOString()
    };
    setToStorage(STORAGE_KEYS.CASES, [newCase, ...cases]);
    logAudit(actor, 'FILE_CASE', 'Case', newCase.id, `Registered case: ${newCase.suitNumber} (${caseId})`);

    // Create case assignment entry
    storageService.createCaseAssignment({
      caseId: newCase.id,
      suitNumber: newCase.suitNumber,
      counselId: newCase.counselId,
      assignedById: actor.id,
      assignedByName: actor.name
    });

    return newCase;
  },
  updateCase: (caseRecord: CaseRecord, actor: User): void => {
    const list = storageService.getCases().map(c => c.id === caseRecord.id ? caseRecord : c);
    setToStorage(STORAGE_KEYS.CASES, list);
    logAudit(actor, 'UPDATE_CASE', 'Case', caseRecord.id, `Updated litigation record: ${caseRecord.suitNumber}`);
  },

  // Case Assignment Workflow
  getCaseAssignments: (): CaseAssignment[] => getFromStorage<CaseAssignment[]>(STORAGE_KEYS.CASE_ASSIGNMENTS, []),
  createCaseAssignment: (data: {
    caseId: string;
    suitNumber: string;
    counselId: string;
    assignedById: string;
    assignedByName: string;
  }): CaseAssignment => {
    const assignments = storageService.getCaseAssignments();
    const newAssignment: CaseAssignment = {
      id: `asgn-${Date.now()}`,
      caseId: data.caseId,
      suitNumber: data.suitNumber,
      counselId: data.counselId,
      assignedById: data.assignedById,
      assignedByName: data.assignedByName,
      dateAssigned: new Date().toISOString(),
      status: 'PENDING'
    };
    setToStorage(STORAGE_KEYS.CASE_ASSIGNMENTS, [newAssignment, ...assignments]);

    // Notify assigned counsel
    const assignedUser = storageService.getUserById(data.counselId);
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
    }
  },

  // Court Diary
  getCourtDiary: (): CourtDiaryEntry[] => getFromStorage<CourtDiaryEntry[]>(STORAGE_KEYS.COURT_DIARY, []),
  addCourtDiaryEntry: (entry: Omit<CourtDiaryEntry, 'id'>, actor: User): CourtDiaryEntry => {
    const entries = storageService.getCourtDiary();
    const newEntry: CourtDiaryEntry = { ...entry, id: `diary-${Date.now()}` };
    setToStorage(STORAGE_KEYS.COURT_DIARY, [newEntry, ...entries]);

    // Also update case next court date
    const cases = storageService.getCases().map(c => {
      if (c.id === entry.caseId) {
        return { ...c, nextCourtDate: entry.courtDate };
      }
      return c;
    });
    setToStorage(STORAGE_KEYS.CASES, cases);

    logAudit(actor, 'SCHEDULE_COURT_DATE', 'CourtDiary', newEntry.id, `Scheduled court appearance for ${entry.suitNumber} on ${entry.courtDate}`);
    return newEntry;
  },
  updateCourtDiaryEntry: (entry: CourtDiaryEntry, actor: User): void => {
    const list = storageService.getCourtDiary().map(e => e.id === entry.id ? entry : e);
    setToStorage(STORAGE_KEYS.COURT_DIARY, list);
    logAudit(actor, 'UPDATE_COURT_DIARY', 'CourtDiary', entry.id, `Updated court date entry for ${entry.suitNumber}`);
  },

  // Tasks
  getTasks: (): Task[] => getFromStorage<Task[]>(STORAGE_KEYS.TASKS, []),
  addTask: (task: Omit<Task, 'id' | 'createdAt'>, actor: User): Task => {
    const tasks = storageService.getTasks();
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setToStorage(STORAGE_KEYS.TASKS, [newTask, ...tasks]);
    logAudit(actor, 'CREATE_TASK', 'Task', newTask.id, `Created task: ${newTask.title}`);
    dispatchNotification('New Task Assigned', `Task "${newTask.title}" assigned to you by ${actor.name}`, 'info', undefined, task.assignedToId);
    return newTask;
  },
  updateTask: (task: Task, actor: User): void => {
    const list = storageService.getTasks().map(t => t.id === task.id ? task : t);
    setToStorage(STORAGE_KEYS.TASKS, list);
    logAudit(actor, 'UPDATE_TASK', 'Task', task.id, `Updated task ${task.title} status: ${task.status}`);
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
      uploadDate: new Date().toISOString(),
      uploadedById: actor.id,
      uploadedByName: actor.name
    };
    setToStorage(STORAGE_KEYS.DOCUMENTS, [newDoc, ...documents]);
    logAudit(actor, 'UPLOAD_DOCUMENT', 'Document', newDoc.id, `Uploaded document: ${newDoc.title} (${docCode})`);
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
    return newItem;
  },

  // Appointments
  getAppointments: (): Appointment[] => getFromStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []),
  addAppointment: (app: Omit<Appointment, 'id'>, actor: User): Appointment => {
    const apps = storageService.getAppointments();
    const newApp: Appointment = { ...app, id: `app-${Date.now()}` };
    setToStorage(STORAGE_KEYS.APPOINTMENTS, [newApp, ...apps]);
    logAudit(actor, 'SCHEDULE_APPOINTMENT', 'Appointment', newApp.id, `Scheduled appointment for ${app.clientName} on ${app.date}`);
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
      propertyId
    };
    setToStorage(STORAGE_KEYS.PROPERTIES, [newProp, ...props]);
    logAudit(actor, 'ADD_PROPERTY', 'Property', newProp.id, `Registered property: ${newProp.name} (${propertyId})`);
    return newProp;
  },
  updateProperty: (prop: Property, actor: User): void => {
    const list = storageService.getProperties().map(p => p.id === prop.id ? prop : p);
    setToStorage(STORAGE_KEYS.PROPERTIES, list);
    logAudit(actor, 'UPDATE_PROPERTY', 'Property', prop.id, `Updated property: ${prop.name}`);
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
    return newLandlord;
  },

  // Units
  getUnits: (): Unit[] => getFromStorage<Unit[]>(STORAGE_KEYS.UNITS, []),
  addUnit: (unit: Omit<Unit, 'id'>, actor: User): Unit => {
    const units = storageService.getUnits();
    const newUnit: Unit = { ...unit, id: `unt-${Date.now()}` };
    setToStorage(STORAGE_KEYS.UNITS, [newUnit, ...units]);
    logAudit(actor, 'ADD_UNIT', 'Unit', newUnit.id, `Added unit ${unit.unitNumber}`);
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
    return newTenant;
  },
  getTenancies: (): Tenancy[] => getFromStorage<Tenancy[]>(STORAGE_KEYS.TENANCIES, []),
  addTenancy: (tenancy: Omit<Tenancy, 'id'>, actor: User): Tenancy => {
    const list = storageService.getTenancies();
    const newTenancy: Tenancy = { ...tenancy, id: `ten-${Date.now()}` };
    setToStorage(STORAGE_KEYS.TENANCIES, [newTenancy, ...list]);
    logAudit(actor, 'CREATE_TENANCY', 'Tenancy', newTenancy.id, `Created tenancy for unit ${tenancy.unitNumber}`);
    return newTenancy;
  },

  // Rent Records
  getRentRecords: (): RentRecord[] => getFromStorage<RentRecord[]>(STORAGE_KEYS.RENT_RECORDS, []),
  addRentRecord: (rent: Omit<RentRecord, 'id'>, actor: User): RentRecord => {
    const list = storageService.getRentRecords();
    const newRent: RentRecord = { ...rent, id: `rent-${Date.now()}` };
    setToStorage(STORAGE_KEYS.RENT_RECORDS, [newRent, ...list]);
    logAudit(actor, 'RECORD_RENT', 'RentRecord', newRent.id, `Recorded rent of ₦${rent.amountPaid.toLocaleString()} for ${rent.tenantName}`);
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
    return newDispute;
  },
  updatePropertyDispute: (dispute: PropertyDispute, actor: User): void => {
    const list = storageService.getPropertyDisputes().map(d => d.id === dispute.id ? dispute : d);
    setToStorage(STORAGE_KEYS.PROPERTY_DISPUTES, list);
    logAudit(actor, 'UPDATE_PREMISES_RECOVERY', 'PropertyDispute', dispute.id, `Stage updated to: ${dispute.workflowStage}`);
  },

  // Institutions & Students & Internships
  getInstitutions: (): Institution[] => getFromStorage<Institution[]>(STORAGE_KEYS.INSTITUTIONS, INITIAL_INSTITUTIONS),
  addInstitution: (inst: Omit<Institution, 'id'>, actor: User): Institution => {
    const list = storageService.getInstitutions();
    const newInst: Institution = { ...inst, id: `inst-${Date.now()}` };
    setToStorage(STORAGE_KEYS.INSTITUTIONS, [...list, newInst]);
    logAudit(actor, 'ADD_INSTITUTION', 'Institution', newInst.id, `Registered institution: ${newInst.name}`);
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
    dispatchNotification('New Student Placement Recorded', `${newStudent.fullName} (${newStudent.institutionName}) enrolled under ${newStudent.placementType}`, 'info', 'HEAD_OF_CHAMBER');
    return newStudent;
  },
  updateStudent: (student: StudentProfile, actor: User): void => {
    const list = storageService.getStudents().map(s => s.id === student.id ? student : s);
    setToStorage(STORAGE_KEYS.STUDENTS, list);
    logAudit(actor, 'UPDATE_STUDENT', 'StudentProfile', student.id, `Updated student profile: ${student.fullName}`);
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
    return newAtt;
  },
  getEvaluations: (): InternshipEvaluation[] => getFromStorage<InternshipEvaluation[]>(STORAGE_KEYS.EVALUATIONS, []),
  submitEvaluation: (evaluation: Omit<InternshipEvaluation, 'id'>, actor: User): InternshipEvaluation => {
    const list = storageService.getEvaluations();
    const newEval: InternshipEvaluation = { ...evaluation, id: `eval-${Date.now()}` };
    setToStorage(STORAGE_KEYS.EVALUATIONS, [newEval, ...list]);
    logAudit(actor, 'SUBMIT_EVALUATION', 'InternshipEvaluation', newEval.id, `Evaluated intern: ${evaluation.studentName}`);
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
    return newNotice;
  },
  updatePublicNotice: (notice: PublicNotice, actor: User): void => {
    const list = storageService.getPublicNotices().map(n => n.id === notice.id ? notice : n);
    setToStorage(STORAGE_KEYS.PUBLIC_NOTICES, list);
    logAudit(actor, 'UPDATE_NOTICE', 'PublicNotice', notice.id, `Updated notice: ${notice.title}`);
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
    if (req) {
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
  getCurrentUserId: (): string => getFromStorage<string>(STORAGE_KEYS.CURRENT_USER_ID, 'usr-principal-01'),
  setCurrentUserId: (id: string): void => {
    setToStorage(STORAGE_KEYS.CURRENT_USER_ID, id);
  },
  getActiveBranchId: (): string => getFromStorage<string>(STORAGE_KEYS.ACTIVE_BRANCH_ID, 'br-abuja-01'),
  setActiveBranchId: (id: string): void => {
    setToStorage(STORAGE_KEYS.ACTIVE_BRANCH_ID, id);
  }
};
