export type UserRole = 
  | 'PRINCIPAL_PARTNER'
  | 'HEAD_OF_CHAMBER'
  | 'ADMINISTRATOR_SECRETARY'
  | 'ACCOUNT_OFFICER'
  | 'COUNSEL_STAFF';

export type AvailabilityStatus = 
  | 'IN_COURT'
  | 'IN_OFFICE'
  | 'AVAILABLE'
  | 'BUSY'
  | 'ON_LEAVE'
  | 'OUT_OF_OFFICE';

export type AccountStatus = 
  | 'Active'
  | 'Inactive'
  | 'Suspended'
  | 'Password Reset Required'
  | 'Archived';

export interface User {
  id: string;
  username: string; // e.g. "principal.partner", "head.chamber", "administrator", "accounts", "counsel"
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  branchId: string;
  title: string; // e.g. "Principal Partner / SAN", "Head of Chamber", "Senior Associate", "Legal Secretary", "Senior Accountant"
  practiceAreas: string[];
  bio: string;
  photoUrl: string;
  availability: AvailabilityStatus;
  isPubliclyVisible: boolean;
  isActive: boolean;
  accountStatus: AccountStatus;
  passwordHash: string;
  salt: string;
  requiresPasswordChange: boolean;
  failedLoginAttempts: number;
  lastLogin?: string;
  passwordChangedAt?: string;
  temporaryResetToken?: string;
  temporaryResetExpires?: string;
  createdAt: string;
}

export interface UserSession {
  userId: string;
  token: string;
  role: UserRole;
  branchId: string;
  rememberMe: boolean;
  expiresAt: string;
  lastActiveAt?: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  headOfChamberId?: string;
  isActive: boolean;
  isHeadOffice?: boolean;
}

export interface Client {
  id: string;
  clientId: string; // e.g. BBC-CLI-2026-0001
  fullName: string;
  organization?: string;
  clientType: 'Individual' | 'Corporate' | 'Government' | 'Estate';
  phone: string;
  email: string;
  address: string;
  state: string;
  lga: string;
  identificationType?: string;
  identificationNumber?: string;
  branchId: string;
  assignedLawyerId?: string;
  conflictCheckStatus: 'Pending' | 'Passed' | 'Flagged';
  conflictCheckNotes?: string;
  conflictReviewedBy?: string;
  dateRegistered: string;
  isActive: boolean;
  confidentialNotes?: string;
}

export interface Consultation {
  id: string;
  code: string; // BBC-CONS-2026-XXXXXX
  serviceCategory: string;
  preferredDate: string;
  preferredTime: string;
  fullName: string;
  phone: string;
  email: string;
  method: 'In-Person (Chambers)' | 'Virtual Video Conference' | 'Telephone Consultation';
  briefEnquiry: string;
  supportingDocuments: string[];
  status: 
    | 'Application Received'
    | 'Awaiting Payment'
    | 'Payment Submitted'
    | 'Payment Verification Pending'
    | 'Payment Verified'
    | 'Under Review'
    | 'Documents Required'
    | 'Documents Received'
    | 'Consultation Confirmed'
    | 'Consultation Completed'
    | 'Matter Opened'
    | 'Cancelled';
  invoiceNumber: string; // BBC-INV-2026-XXXXXX
  paymentReference: string; // BBC-PAY-2026-XXXXXX
  branchId: string;
  assignedLawyerId?: string;
  clientVisibleUpdate?: string;
  createdAt: string;
}

export interface Matter {
  id: string;
  matterId: string; // BBC-MAT-2026-XXXXXX
  title: string;
  clientId: string;
  branchId: string;
  leadCounselId: string;
  category: 'Litigation' | 'Property & Tenancy' | 'Corporate' | 'Sharia / Islamic Law' | 'Consultancy' | 'Alternative Dispute Resolution';
  status: 'Intake' | 'Active' | 'Pending Approval' | 'Closed' | 'Archived';
  stage: string;
  engagementDate: string;
  clientVisibleUpdate: string;
  privilegedInternalNotes: string;
  requiresPrincipalApproval: boolean;
  principalApprovalStatus?: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

export interface Court {
  id: string;
  name: string;
  courtType: 'Supreme Court' | 'Court of Appeal' | 'Federal High Court' | 'High Court' | 'Magistrate Court' | 'National Industrial Court' | 'Sharia Court' | 'Customary Court' | 'Other';
  state: string;
  judicialDivision: string;
  location: string;
  defaultJudge?: string;
}

export interface CaseRecord {
  id: string;
  caseId: string; // BBC-CASE-2026-XXXXXX
  suitNumber: string;
  matterId: string;
  clientId: string;
  branchId?: string;
  courtId: string;
  judicialDivision: string;
  judge?: string;
  counselId: string;
  opposingParty: string;
  opposingCounsel?: string;
  caseType: 'Civil' | 'Criminal' | 'Commercial' | 'Property/Tenancy' | 'Constitutional' | 'Sharia/Family';
  subjectMatter: string;
  filingDate: string;
  nextCourtDate?: string;
  status: 'Pleadings' | 'Hearing' | 'Trial' | 'Final Addresses' | 'Judgment Reserved' | 'Disposed' | 'On Appeal';
  clientVisibleUpdate: string;
  internalStrategyNotes: string;
  createdAt: string;
}

export interface CaseAssignment {
  id: string;
  caseId: string;
  suitNumber: string;
  branchId?: string;
  counselId: string;
  assignedById: string;
  assignedByName: string;
  dateAssigned: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'REASSIGNED';
  rejectionReason?: 'Existing workload' | 'Court conflict' | 'Leave' | 'Conflict of interest' | 'Unavailability' | 'Other';
  rejectionNotes?: string;
  responseDate?: string;
}

export interface CourtDiaryEntry {
  id: string;
  caseId: string;
  suitNumber: string;
  branchId?: string;
  courtDate: string;
  courtTime?: string;
  courtName: string;
  counselId: string;
  clientId: string;
  purpose: string;
  status: 'Scheduled' | 'Attended' | 'Adjourned' | 'Concluded';
  outcomeSummary?: string;
  nextCourtDate?: string;
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  assignedToId: string;
  assignedById: string;
  branchId?: string;
  matterId?: string;
  caseId?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue' | 'Cancelled';
  completionDate?: string;
  notes?: string;
  createdAt: string;
}

export interface DocumentRecord {
  id: string;
  documentId: string;
  title: string;
  branchId?: string;
  category: 
    | 'Client Documents'
    | 'Court Documents'
    | 'Pleadings'
    | 'Affidavits'
    | 'Applications'
    | 'Agreements'
    | 'Correspondence'
    | 'Property Documents'
    | 'Tenancy Documents'
    | 'Invoices'
    | 'Receipts'
    | 'Consultation Documents'
    | 'Internship Documents'
    | 'Institutional Letters'
    | 'Court Orders'
    | 'Judgments'
    | 'Other';
  entityType?: 'client' | 'matter' | 'case' | 'property' | 'tenant' | 'student';
  entityId?: string;
  fileUrl?: string;
  fileSize?: string;
  fileType?: string;
  fileName?: string;
  fileDataUrl?: string;
  uploadedById: string;
  uploadedByName: string;
  version: string;
  uploadDate: string;
  isClientVisible: boolean;
  notes?: string;
  googleDriveLink?: string;
}

export interface Correspondence {
  id: string;
  referenceNumber: string;
  branchId?: string;
  type: 'Letter' | 'Email' | 'Notice' | 'Demand' | 'Court Correspondence' | 'Institutional Communication';
  date: string;
  sender: string;
  recipient: string;
  subject: string;
  content: string;
  direction?: string;
  status?: string;
  matterId?: string;
  caseId?: string;
  clientId?: string;
  propertyId?: string;
  loggedById: string;
}

export interface LegalResearch {
  id: string;
  topic: string;
  legalIssue: string;
  branchId?: string;
  statutes: string;
  caseAuthorities: string;
  legalNotes: string;
  matterId?: string;
  caseId?: string;
  counselId: string;
  counselName: string;
  date: string;
}

export interface Appointment {
  id: string;
  title: string;
  clientName: string;
  phone?: string;
  email?: string;
  counselId: string;
  appointmentType: 'Legal consultation' | 'Client meeting' | 'Court-related preparation' | 'Property inspection' | 'Internal meeting' | 'Student/intern supervision' | 'Other';
  date: string;
  time: string;
  branchId: string;
  location: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
  notes?: string;
}

export interface Property {
  id: string;
  propertyId: string;
  branchId?: string;
  name: string;
  propertyType: 
    | 'Residential House'
    | 'Duplex'
    | 'Apartment'
    | 'Flat'
    | 'Self-contained'
    | 'Office'
    | 'Shop'
    | 'Commercial Building'
    | 'Warehouse'
    | 'Plaza'
    | 'Land'
    | 'Estate'
    | 'Farm'
    | 'Industrial Property'
    | 'Other';
  address: string;
  state: string;
  lga: string;
  district: string;
  landlordId: string;
  imageUrl?: string;
  registrationPaymentStatus?: 'PENDING_PAYMENT' | 'PAID_CONFIRMED';
  registrationFee?: number;
  totalUnits: number;
  titleInformation: string;
  surveyInformation: string;
  legalStatus: 'Managed by Chambers' | 'In Dispute' | 'Recovery of Premises Pending' | 'Free of Encumbrances';
  assignedLawyerId: string;
  relatedClientId?: string;
  relatedMatterId?: string;
  notes?: string;
}

export interface Landlord {
  id: string;
  landlordId: string;
  branchId?: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  bankDetails?: string;
  trackingCode: string;
  dateRegistered: string;
}

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  description: string;
  annualRent: number;
  status: 'Vacant' | 'Occupied' | 'Under Maintenance';
  currentTenantId?: string;
}

export interface Tenant {
  id: string;
  tenantId: string;
  fullName: string;
  phone: string;
  email: string;
  landlordId: string;
  propertyId: string;
  unitNumber: string;
  trackingCode: string;
  occupation?: string;
  status: 'Prospective' | 'Active' | 'Expiring Soon' | 'Expired' | 'Renewed' | 'Terminated' | 'Vacated' | 'Disputed';
  dateRegistered: string;
}

export interface Tenancy {
  id: string;
  tenantId: string;
  propertyId: string;
  unitNumber: string;
  rentAmount: number;
  startDate: string;
  expiryDate: string;
  paymentFrequency: 'Annual' | 'Bi-Annual' | 'Quarterly' | 'Monthly';
  status: 'Active' | 'Expiring Soon' | 'Expired' | 'Renewed' | 'Terminated';
  arrearsAmount: number;
  tenancyAgreementDocId?: string;
}

export interface RentRecord {
  id: string;
  tenancyId: string;
  tenantName: string;
  propertyId: string;
  unitNumber: string;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  paymentDate?: string;
  status: 'Paid' | 'Partially Paid' | 'Arrears' | 'Pending Verification';
  paymentReference?: string;
  receiptNumber?: string;
}

export interface PropertyDispute {
  id: string;
  propertyId: string;
  tenantId: string;
  complaintTitle: string;
  workflowStage: 
    | 'Complaint Received'
    | 'Client Intake'
    | 'Conflict Check'
    | 'Tenancy Documents Reviewed'
    | 'Rent Position Reviewed'
    | 'Notice Requirements Reviewed'
    | 'Notice Prepared'
    | 'Notice Served'
    | 'Response'
    | 'Negotiation'
    | 'Court Proceedings'
    | 'Judgment/Order'
    | 'Enforcement'
    | 'Matter Closed';
  noticeServedDate?: string;
  noticeExpiryDate?: string;
  counselInChargeId: string;
  suitNumber?: string;
  statusSummary: string;
  counselNotes: string;
  createdAt: string;
}

export interface QuitNotice {
  id: string;
  quitNoticeId: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  landlordId: string;
  landlordName: string;
  unitNumber: string;
  noticeType: 'Quit Notice' | "Owner's Intention to Recover Possession" | 'Notice to Quit';
  noticeDate: string;
  noticeExpiryDate: string;
  reason: string;
  statutoryBasis: string;
  status: 'Issued' | 'Served' | 'Expired' | 'Complied With' | 'Disputed';
  issuedById: string;
  issuedByName: string;
  createdAt: string;
}

export interface InvoiceItem {
  description: string;
  amount: number;
}

/**
 * Explicit purpose codes recorded on an invoice so the verification flow knows
 * exactly what a payment settles — never inferred from invoice descriptions.
 */
export type InvoicePurpose =
  | 'CONSULTATION_FEE'
  | 'NEW_LANDLORD_PROPERTY_REGISTRATION'
  | 'ADDITIONAL_PROPERTY_REGISTRATION'
  | 'GENERAL_BILLING';

/** The kind of paid service an invoice/payment settles. */
export type PaymentServiceType = 'CONSULTATION' | 'PROPERTY' | 'GENERAL';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  matterId?: string;
  branchId?: string;
  consultationId?: string;
  consultationCode?: string;
  /** Explicit purpose of the invoice (InvoicePurpose). */
  purpose?: InvoicePurpose;
  /** Explicit service relationship used during payment verification. */
  serviceType?: PaymentServiceType;
  serviceRef?: string;
  propertyId?: string;
  landlordId?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  date: string;
  dueDate: string;
  paymentStatus: 'UNPAID' | 'PAYMENT_SUBMITTED' | 'PAYMENT_VERIFIED' | 'CANCELLED';
  approvalStatus?: 'NONE' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  approvalRequestId?: string;
  approvalNotes?: string;
  paymentReference: string;
  paymentMethod?: string;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  paymentReference: string;
  invoiceNumber: string;
  /** invoices.id this payment settles (explicit relationship). */
  invoiceId?: string;
  /** Paid-service link copied from the invoice at submission time. */
  serviceType?: PaymentServiceType;
  serviceRef?: string;
  clientName: string;
  amount: number;
  branchId?: string;
  paymentMethod: 'Bank Transfer' | 'Online Payment Gateway' | 'POS' | 'Cash' | 'Other';
  paymentDate: string;
  status: 'PAYMENT_SUBMITTED' | 'PAYMENT_VERIFIED' | 'REJECTED';
  bankTransactionRef?: string;
  receiptNumber?: string;
  verifiedById?: string;
  verifiedByName?: string;
  verificationDate?: string;
  verificationNotes?: string;
  proofDocumentUrl?: string;
  submittedAt: string;
}

export interface ExpenseRecord {
  id: string;
  branchId?: string;
  accountType: 'Law Firm Revenue' | 'Client Funds' | 'Property Account';
  category: 'Court expenses' | 'Filing expenses' | 'Transportation' | 'Service expenses' | 'Property expenses' | 'Maintenance expenses' | 'Administrative expenses' | 'Other approved expenses';
  amount: number;
  description: string;
  date: string;
  recordedById: string;
  recordedByName: string;
  matterId?: string;
  propertyId?: string;
  receiptRef?: string;
}

export interface Institution {
  id: string;
  code: string;
  name: string;
  type: 'Nigerian Law School' | 'University' | 'Faculty of Law' | 'Legal Training Institution' | 'Other Educational Institution';
  address: string;
  state: string;
  contactPerson: string;
  officialEmail: string;
  phone: string;
  relationshipStatus: 'Active Partner' | 'Approved Institution' | 'Inactive';
  notes?: string;
}

export interface StudentProfile {
  id: string;
  studentId: string;
  fullName: string;
  gender?: 'Male' | 'Female';
  phone: string;
  email: string;
  institutionId: string;
  institutionName: string;
  faculty: string;
  programme: string;
  level: string;
  matricNumber: string;
  placementType: 'Institution-Referred' | 'Direct Student Application';
  placementStartDate: string;
  placementEndDate: string;
  assignedBranchId: string;
  supervisingCounselId: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  status: 
    | 'Application Received'
    | 'Documents Under Review'
    | 'Awaiting Institution Verification'
    | 'Under Chambers Review'
    | 'Approved'
    | 'Rejected'
    | 'Placement Confirmed'
    | 'Awaiting Start Date'
    | 'Active Placement'
    | 'Completed'
    | 'Closed';
  referralLetterDocId?: string;
  cvDocId?: string;
  completionLetterIssued: boolean;
  certificateNumber?: string;
  createdAt: string;
}

export interface InternshipAttendance {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  arrivalTime: string;
  departureTime?: string;
  status: 'Present' | 'Absent' | 'Excused' | 'Approved Leave';
  supervisorNotes?: string;
  loggedById: string;
}

export interface InternshipEvaluation {
  id: string;
  studentId: string;
  studentName: string;
  evaluationDate: string;
  evaluatorCounselId: string;
  evaluatorCounselName: string;
  punctualityScore: number;
  professionalConductScore: number;
  legalResearchScore: number;
  draftingScore: number;
  communicationScore: number;
  courtroomObservationScore: number;
  teamworkScore: number;
  confidentialityScore: number;
  generalPerformanceScore: number;
  supervisorComments: string;
  recommendedForCertificate: boolean;
}

export interface PublicNotice {
  id: string;
  title: string;
  category: 'Office working hours' | 'Public announcements' | 'Holiday notices' | 'Consultation availability' | 'Approved service announcements' | 'Internship announcements' | 'Chambers events' | 'Public legal information';
  content: string;
  publishDate: string;
  expiryDate?: string;
  status: 'Draft' | 'Published' | 'Archived';
  publishedById: string;
  publishedByName: string;
}

export interface PublicEnquiry {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  branchId: string;
  status: 'Pending' | 'Attended' | 'Closed';
  createdAt: string;
}

export type ApprovalStatus = 
  | 'PENDING_HEAD_OF_CHAMBER'
  | 'FORWARDED_TO_PRINCIPAL_PARTNER'
  | 'APPROVED'
  | 'REJECTED'
  | 'PENDING_PRINCIPAL_PARTNER_APPROVAL';

export interface ApprovalRequest {
  id: string;
  requestType: 
    | 'Special Approval'
    | 'Head of Chamber Action' 
    | 'Fee Adjustment' 
    | 'Notice of Premises' 
    | 'Settlement Proposal' 
    | 'Public Content Publication' 
    | 'Invoice Billing Approval'
    | 'Litigation Strategy'
    | 'Emergency Chamber Expenditure';
  requesterId: string;
  requesterName: string;
  requesterRole: UserRole;
  branchId: string;
  title: string;
  description: string;
  urgency?: 'Normal' | 'High' | 'Emergency / Critical';
  referenceCode?: string;
  status: ApprovalStatus;
  submittedAt: string;
  forwardedAt?: string;
  forwardedById?: string;
  forwardedByName?: string;
  forwardReason?: string;
  decidedAt?: string;
  decidedById?: string;
  decidedByName?: string;
  decisionNotes?: string;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  targetRole?: UserRole;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'urgent';
  date: string;
  isRead: boolean;
  linkAction?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entity: string;
  entityId: string;
  details: string;
}

// WEBSITE CONTENT MANAGEMENT (CMS)
export interface WebsiteContent {
  tagline: string;
  heroHeadline: string;
  heroSubheadline: string;
  aboutStory: string;
  aboutFoundingYear: string;
  officeHoursText: string;
  emergencyHotline: string;
  consultationFeeStandard: number;
  internshipPolicyNotice: string;
  recoveryOfPremisesNotice: string;
  // Invoice / payment settlement details (editable via CMS)
  invoiceBankName: string;
  invoiceAccountName: string;
  invoiceAccountNumber: string;
  invoicePaymentMethod: string;
  lastUpdated: string;
  updatedBy: string;
}
