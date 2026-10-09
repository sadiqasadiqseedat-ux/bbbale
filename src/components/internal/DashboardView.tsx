import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Briefcase, 
  FileText, 
  Calendar, 
  CheckSquare, 
  Building2, 
  CreditCard, 
  GraduationCap, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  Scale,
  Shield,
  Send,
  X
} from 'lucide-react';
import { storageService, subscribeToStore } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { 
  CaseAssignment, 
  ApprovalRequest, 
  CourtDiaryEntry, 
  Task, 
  Invoice, 
  AuditLog,
  AvailabilityStatus,
  User
} from '../../types';

interface DashboardViewProps {
  onNavigateSection: (section: string, id?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateSection }) => {
  const { 
    currentUser, 
    isPrincipalPartner, 
    isHeadOfChamber, 
    isAdminSecretary, 
    isAccountOfficer, 
    isCounselStaff,
    activeBranchId,
    isAllBranches,
    updateAvailability
  } = useAuth();

  const [metrics, setMetrics] = useState({
    clientsCount: 0,
    mattersCount: 0,
    casesCount: 0,
    courtDatesCount: 0,
    pendingTasksCount: 0,
    propertiesCount: 0,
    tenantsCount: 0,
    expiringTenanciesCount: 0,
    outstandingInvoicesCount: 0,
    pendingPaymentsCount: 0,
    verifiedPaymentsTotal: 0,
    pendingApprovalsCount: 0,
    pendingAssignmentsCount: 0,
    activeInternshipsCount: 0
  });

  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [counselAssignments, setCounselAssignments] = useState<CaseAssignment[]>([]);
  const [upcomingCourtDates, setUpcomingCourtDates] = useState<CourtDiaryEntry[]>([]);
  const [recentAudits, setRecentAudits] = useState<AuditLog[]>([]);
  const [allStaff, setAllStaff] = useState<User[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [statusFeedback, setStatusFeedback] = useState<string>('');

  // Modals for assignment rejection
  const [rejectingAssignmentId, setRejectingAssignmentId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<CaseAssignment['rejectionReason']>('Existing workload');
  const [rejectionNotes, setRejectionNotes] = useState('');

  // Special Approvals Workflow States
  const [isSpecialApprovalModalOpen, setIsSpecialApprovalModalOpen] = useState(false);
  const [specialApprovalForm, setSpecialApprovalForm] = useState({
    title: '',
    requestType: 'Special Approval' as ApprovalRequest['requestType'],
    urgency: 'Normal' as NonNullable<ApprovalRequest['urgency']>,
    referenceCode: '',
    description: ''
  });
  const [approvalSubmitNotice, setApprovalSubmitNotice] = useState<string>('');

  const loadData = () => {
    const clients = storageService.getClients();
    const matters = storageService.getMatters();
    const cases = storageService.getCases();
    const courtDates = storageService.getCourtDiary();
    const tasks = storageService.getTasks();
    const properties = storageService.getProperties();
    const tenants = storageService.getTenants();
    const tenancies = storageService.getTenancies();
    const invoices = storageService.getInvoices();
    const payments = storageService.getPayments();
    const approvals = storageService.getApprovals();
    const assignments = storageService.getCaseAssignments();
    const students = storageService.getStudents();
    const audits = storageService.getAuditLogs();

    // Filter by branch if not Principal Partner on all branches
    const branchFilter = (itemBranchId?: string) => {
      if (isPrincipalPartner && isAllBranches) return true;
      if (!itemBranchId) return true;
      return itemBranchId === activeBranchId;
    };

    const pendingApprs = approvals.filter(a => a.status === 'PENDING_PRINCIPAL_PARTNER_APPROVAL');
    setPendingApprovals(pendingApprs);

    // If counsel, filter assignments for this user
    const pendingAsgns = isCounselStaff
      ? assignments.filter(a => a.counselId === currentUser?.id && a.status === 'PENDING')
      : assignments.filter(a => a.status === 'PENDING');
    setCounselAssignments(pendingAsgns);

    // Upcoming court dates (sorted ascending)
    const sortedDates = [...courtDates].sort((a, b) => a.courtDate.localeCompare(b.courtDate)).slice(0, 5);
    setUpcomingCourtDates(sortedDates);

    // Recent audits
    setRecentAudits(audits.slice(0, 6));

    const totalVerified = payments
      .filter(p => p.status === 'PAYMENT_VERIFIED')
      .reduce((sum, p) => sum + p.amount, 0);

    const expiringCount = tenancies.filter(t => t.status === 'Expiring Soon').length;
    const pendingPayCount = payments.filter(p => p.status === 'PAYMENT_SUBMITTED').length;
    const activeStaff = storageService.getUsers().filter(u => u.isActive);
    setAllStaff(activeStaff);
    if (!selectedStaffId && currentUser) {
      setSelectedStaffId(currentUser.id);
    }

    setMetrics({
      clientsCount: clients.length,
      mattersCount: matters.length,
      casesCount: cases.length,
      courtDatesCount: courtDates.length,
      pendingTasksCount: tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length,
      propertiesCount: properties.length,
      tenantsCount: tenants.length,
      expiringTenanciesCount: expiringCount,
      outstandingInvoicesCount: invoices.filter(i => i.paymentStatus === 'UNPAID').length,
      pendingPaymentsCount: pendingPayCount,
      verifiedPaymentsTotal: totalVerified,
      pendingApprovalsCount: pendingApprs.length,
      pendingAssignmentsCount: pendingAsgns.length,
      activeInternshipsCount: students.filter(s => s.status === 'Active Placement').length
    });
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStore(loadData);
    return () => unsub();
  }, [currentUser, activeBranchId, isAllBranches]);

  const handleApproveRequest = (reqId: string, status: 'APPROVED' | 'REJECTED') => {
    if (currentUser) {
      storageService.decideApproval(reqId, status, `Decided by ${currentUser.name} (${currentUser.role})`, currentUser);
    }
  };

  const handleCreateSpecialApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !specialApprovalForm.title.trim()) return;

    storageService.requestSpecialApproval({
      title: specialApprovalForm.title.trim(),
      requestType: specialApprovalForm.requestType,
      urgency: specialApprovalForm.urgency,
      referenceCode: specialApprovalForm.referenceCode.trim() || undefined,
      description: specialApprovalForm.description.trim(),
      branchId: currentUser.branchId || 'br-abuja-01'
    }, currentUser);

    setSpecialApprovalForm({
      title: '',
      requestType: 'Special Approval',
      urgency: 'Normal',
      referenceCode: '',
      description: ''
    });
    setIsSpecialApprovalModalOpen(false);
    setApprovalSubmitNotice('Special approval request submitted directly to Head of Chamber. If beyond branch operational scope, it will be escalated to the Principal Partner.');
    setTimeout(() => setApprovalSubmitNotice(''), 6000);
  };

  const handleRespondAssignment = (assignmentId: string, status: 'ACCEPTED' | 'REJECTED') => {
    if (status === 'ACCEPTED') {
      storageService.respondToAssignment(assignmentId, 'ACCEPTED', undefined, undefined, currentUser || undefined);
    } else {
      setRejectingAssignmentId(assignmentId);
    }
  };

  const confirmRejection = () => {
    if (rejectingAssignmentId && currentUser) {
      storageService.respondToAssignment(
        rejectingAssignmentId,
        'REJECTED',
        rejectionReason,
        rejectionNotes || 'Counsel cannot accommodate fixture.',
        currentUser
      );
      setRejectingAssignmentId(null);
      setRejectionNotes('');
    }
  };

  return (
    <div className="space-y-6">
      {approvalSubmitNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{approvalSubmitNotice}</span>
          </div>
          <button onClick={() => setApprovalSubmitNotice('')} className="text-emerald-700 hover:text-emerald-900 font-bold text-xs">✕</button>
        </div>
      )}

      {/* Header Banner - Distinct for each of the 5 Authorized Roles */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider font-mono">
              {isPrincipalPartner ? '1. PRINCIPAL PARTNER DASHBOARD' :
               isHeadOfChamber ? '2. HEAD OF CHAMBER DASHBOARD' :
               isAdminSecretary ? '3. ADMINISTRATOR / SECRETARY DASHBOARD' :
               isAccountOfficer ? '4. ACCOUNT OFFICER DASHBOARD' :
               '5. COUNSEL / STAFF DASHBOARD'}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-medium">
              {isAllBranches ? 'Universal Chambers Jurisdiction' : 'Branch Jurisdiction'}
            </span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 mt-1">
            {isPrincipalPartner && 'Principal Partner Executive Dashboard'}
            {isHeadOfChamber && 'Head of Chamber Operational Dashboard'}
            {isAdminSecretary && 'Administrator / Secretary Operational Dashboard'}
            {isAccountOfficer && 'Account Officer Financial & Invoicing Dashboard'}
            {isCounselStaff && 'Counsel / Staff Litigation Docket Dashboard'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isPrincipalPartner && 'Welcome, Principal Partner. System-Wide Governance · All Branches · Staff Management · Executive Approvals.'}
            {isHeadOfChamber && `Welcome, Head of Chamber. Managing Branch Operations · Matter Allocation · Cause List · Staff Oversight.`}
            {isAdminSecretary && 'Welcome, Chambers Administrator. Full Website Content Control · Public Notices · Client Intake · Fixtures Registry.'}
            {isAccountOfficer && 'Welcome, Account Officer. Client Retainers · Trust Escrow · Consultation Invoices · Payment Verifications.'}
            {isCounselStaff && `Welcome, ${currentUser?.name}. Assigned Cases & Briefs · Court Diary Fixtures · Task Deadlines · Availability.`}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {isPrincipalPartner && (
            <span className="text-xs bg-amber-50 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5">
              <Scale className="w-4 h-4 text-amber-700" />
              <span>Highest Operational & Global Authority</span>
            </span>
          )}
          {isHeadOfChamber && (
            <span className="text-xs bg-purple-50 text-purple-900 border border-purple-300 px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5">
              <Briefcase className="w-4 h-4 text-purple-700" />
              <span>Branch Operational Leadership</span>
            </span>
          )}
          {isAdminSecretary && (
            <span className="text-xs bg-blue-50 text-blue-900 border border-blue-300 px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-blue-700" />
              <span>Full Website & Intake Authority</span>
            </span>
          )}
          {isAccountOfficer && (
            <span className="text-xs bg-emerald-50 text-emerald-900 border border-emerald-300 px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5">
              <CreditCard className="w-4 h-4 text-emerald-700" />
              <span>Chambers Financial Comptroller</span>
            </span>
          )}
          {isCounselStaff && (
            <span className="text-xs bg-slate-100 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Status: {currentUser?.availability.replace('_', ' ')}</span>
            </span>
          )}
        </div>
      </div>

      {/* Live Real-Time Availability Switcher & Chamber Personnel Active Board */}
      {(() => {
        const userBranchId = currentUser?.branchId || 'br-abuja-01';
        const branches = storageService.getBranches();
        const activeChamber = branches.find(b => b.id === userBranchId);

        // Enforce: User active board is seen only to those in the same chamber (or all if Principal Partner in ALL_BRANCHES mode)
        const chamberStaff = allStaff.filter(u => {
          if (isPrincipalPartner && isAllBranches) return true;
          return (u.branchId || 'br-abuja-01') === userBranchId;
        });

        const targetStaff = chamberStaff.find(u => u.id === selectedStaffId) || currentUser;

        const handleSetAvailability = (st: AvailabilityStatus) => {
          if (!targetStaff || !currentUser) return;
          storageService.updateCounselAvailability(targetStaff.id, st, currentUser);
          if (targetStaff.id === currentUser.id) {
            updateAvailability(st);
          }
          const refreshed = storageService.getUsers().filter(u => u.isActive);
          setAllStaff(refreshed);
          setStatusFeedback(`✓ Successfully updated ${targetStaff.name} to "${st.replace('_', ' ')}". Reflecting live on the public website!`);
          setTimeout(() => setStatusFeedback(''), 4000);
        };

        return (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shrink-0 shadow-xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-serif font-bold text-sm sm:text-base text-slate-900">
                      {isPrincipalPartner && isAllBranches ? 'National Chambers Live Availability Control' : `${activeChamber?.name || 'Chamber'} Personnel Active Board`}
                    </h3>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      <span>Reflecting Live to Public Website</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isPrincipalPartner && isAllBranches 
                      ? 'National executive oversight of all counsel and advocates across Chambers branches.'
                      : `Stationed active personnel within ${activeChamber?.name || 'same chamber'}. Only visible to colleagues in this chamber jurisdiction.`}
                  </p>
                </div>
              </div>

              {/* Personnel Selector Dropdown */}
              <div className="flex items-center space-x-2 w-full md:w-auto">
                <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                  Selected Colleague:
                </label>
                <select
                  value={selectedStaffId || currentUser?.id || ''}
                  onChange={e => setSelectedStaffId(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-900 focus:outline-hidden focus:border-amber-600 cursor-pointer w-full md:w-auto"
                >
                  {chamberStaff.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role.replace(/_/g, ' ')}) — [{u.availability.replace(/_/g, ' ')}]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {statusFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-xs font-semibold flex items-center space-x-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{statusFeedback}</span>
              </div>
            )}

            {targetStaff && (
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-1">
                <div className="flex items-center space-x-3.5">
                  {targetStaff.photoUrl ? (
                    <img
                      src={targetStaff.photoUrl}
                      alt={targetStaff.name}
                      onError={e => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200 shadow-2xs shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-amber-900/10 border border-amber-600/30 flex items-center justify-center text-amber-900 font-bold text-sm shrink-0 font-serif">
                      {targetStaff.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('')}
                    </div>
                  )}
                  <div>
                    <h4 className="font-serif font-bold text-sm text-slate-950">
                      {targetStaff.name}
                    </h4>
                    <p className="text-xs text-amber-800 font-medium">
                      {targetStaff.title} · <span className="font-mono text-slate-500">{targetStaff.role.replace(/_/g, ' ')}</span>
                    </p>
                    <div className="mt-1 flex items-center space-x-2">
                      <span className="text-[11px] text-slate-500">
                        Current Status: <strong className="text-slate-800 font-mono font-bold uppercase">{targetStaff.availability.replace(/_/g, ' ')}</strong>
                      </span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold">
                        Published on Public Site
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
                  {(['AVAILABLE', 'IN_COURT', 'IN_OFFICE', 'BUSY', 'ON_LEAVE', 'OUT_OF_OFFICE'] as AvailabilityStatus[]).map(st => {
                    const isActive = targetStaff.availability === st;
                    return (
                      <button
                        key={st}
                        onClick={() => handleSetAvailability(st)}
                        className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all flex items-center space-x-1.5 ${
                          isActive
                            ? st === 'AVAILABLE' ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-400/30'
                            : st === 'IN_COURT' ? 'bg-amber-600 text-white border-amber-700 shadow-xs ring-2 ring-amber-400/30'
                            : st === 'IN_OFFICE' ? 'bg-blue-600 text-white border-blue-700 shadow-xs ring-2 ring-blue-400/30'
                            : st === 'BUSY' ? 'bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-400/30'
                            : st === 'ON_LEAVE' ? 'bg-purple-600 text-white border-purple-700 shadow-xs ring-2 ring-purple-400/30'
                            : 'bg-slate-700 text-white border-slate-800 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
                        <span>
                          {st === 'AVAILABLE' ? 'Available'
                            : st === 'IN_COURT' ? 'In Court'
                            : st === 'IN_OFFICE' ? 'In Office'
                            : st === 'BUSY' ? 'Busy / Conference'
                            : st === 'ON_LEAVE' ? 'On Leave'
                            : 'Out of Office'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Counsel Overview Bar - Chamber Scope Only */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  {isPrincipalPartner && isAllBranches 
                    ? 'All Chambers Counsel Active Board' 
                    : `${activeChamber?.name || 'Chamber'} Colleague Active Board (${chamberStaff.length} stationed personnel):`}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Visible to same-chamber members
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {chamberStaff.filter(u => u.isActive).map(staff => (
                  <div
                    key={staff.id}
                    onClick={() => setSelectedStaffId(staff.id)}
                    className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                      selectedStaffId === staff.id
                        ? 'border-amber-500 bg-amber-50/50'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      {staff.photoUrl ? (
                        <img 
                          src={staff.photoUrl} 
                          alt={staff.name} 
                          onError={e => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                          className="w-7 h-7 rounded-full object-cover shrink-0" 
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-amber-900/10 border border-amber-600/30 flex items-center justify-center text-amber-900 font-bold text-[10px] shrink-0 font-serif">
                          {staff.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('')}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{staff.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{staff.title}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ml-2 ${
                      staff.availability === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                      staff.availability === 'IN_COURT' ? 'bg-amber-100 text-amber-900 font-bold' :
                      staff.availability === 'IN_OFFICE' ? 'bg-blue-100 text-blue-800' :
                      staff.availability === 'BUSY' ? 'bg-rose-100 text-rose-800' :
                      staff.availability === 'ON_LEAVE' ? 'bg-purple-100 text-purple-800' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {staff.availability.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Role-Specific Quick Action Shortcuts */}
      <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-slate-800">
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-serif font-bold text-amber-400 uppercase tracking-wider text-[11px]">
            Role Quick Navigation:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Universal Special Approval Request for All Staff */}
          <button
            onClick={() => setIsSpecialApprovalModalOpen(true)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold transition-colors flex items-center space-x-1 shadow-xs"
            title="Submit a special approval request to Head of Chamber (escalatable to Principal Partner)"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Special Approval Request</span>
          </button>
          {isPrincipalPartner && (
            <>
              <button 
                onClick={() => onNavigateSection('users')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg font-semibold transition-colors flex items-center space-x-1"
              >
                <Users className="w-3.5 h-3.5" />
                <span>User Management</span>
              </button>
              <button 
                onClick={() => onNavigateSection('website_content')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition-colors flex items-center space-x-1"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Website & Content</span>
              </button>
              <button 
                onClick={() => onNavigateSection('matters_cases')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition-colors flex items-center space-x-1"
              >
                <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                <span>All Litigation & Matters</span>
              </button>
              <button 
                onClick={() => onNavigateSection('administration')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition-colors flex items-center space-x-1"
              >
                <Scale className="w-3.5 h-3.5 text-teal-400" />
                <span>Branches & Audits</span>
              </button>
            </>
          )}

          {isHeadOfChamber && (
            <>
              <button 
                onClick={() => onNavigateSection('users')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg font-semibold transition-colors flex items-center space-x-1"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Staff Management</span>
              </button>
              <button 
                onClick={() => onNavigateSection('website_content')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition-colors flex items-center space-x-1"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Website & Notices</span>
              </button>
              <button 
                onClick={() => onNavigateSection('matters_cases')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition-colors flex items-center space-x-1"
              >
                <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                <span>Assign Matters</span>
              </button>
              <button 
                onClick={() => onNavigateSection('court_diary')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition-colors flex items-center space-x-1"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Court Diary</span>
              </button>
            </>
          )}

          {isAdminSecretary && (
            <>
              <button 
                onClick={() => onNavigateSection('website_content')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold transition-colors flex items-center space-x-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Website & Content Control</span>
              </button>
              <button 
                onClick={() => onNavigateSection('clients')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition-colors flex items-center space-x-1"
              >
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Client Intake</span>
              </button>
              <button 
                onClick={() => onNavigateSection('consultations')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition-colors flex items-center space-x-1"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Consultations</span>
              </button>
              <button 
                onClick={() => onNavigateSection('court_diary')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition-colors flex items-center space-x-1"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cause List Registry</span>
              </button>
            </>
          )}

          {isAccountOfficer && (
            <>
              <button 
                onClick={() => onNavigateSection('billing')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors flex items-center space-x-1"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Invoices & Verification</span>
              </button>
              <button 
                onClick={() => onNavigateSection('consultations')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition-colors flex items-center space-x-1"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Consultation Invoices</span>
              </button>
              <button 
                onClick={() => onNavigateSection('properties')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition-colors flex items-center space-x-1"
              >
                <Building2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Property Escrows</span>
              </button>
            </>
          )}

          {isCounselStaff && (
            <>
              <button 
                onClick={() => onNavigateSection('matters_cases')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg font-semibold transition-colors flex items-center space-x-1"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>My Cases & Briefs</span>
              </button>
              <button 
                onClick={() => onNavigateSection('court_diary')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition-colors flex items-center space-x-1"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Court Diary</span>
              </button>
              <button 
                onClick={() => onNavigateSection('tasks')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition-colors flex items-center space-x-1"
              >
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Active Tasks</span>
              </button>
              <button 
                onClick={() => onNavigateSection('legal_research')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition-colors flex items-center space-x-1"
              >
                <Scale className="w-3.5 h-3.5 text-purple-400" />
                <span>Legal Research</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Primary Metrics Grid (Calculated from real records) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div 
          onClick={() => onNavigateSection('clients')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-500/50 cursor-pointer transition-colors"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Clients</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-serif font-bold text-slate-900 mt-2">{metrics.clientsCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Retainer & Individual</p>
        </div>

        <div 
          onClick={() => onNavigateSection('matters_cases')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-500/50 cursor-pointer transition-colors"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Matters</span>
            <Briefcase className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-serif font-bold text-slate-900 mt-2">{metrics.mattersCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Active Engagements</p>
        </div>

        <div 
          onClick={() => onNavigateSection('matters_cases')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-500/50 cursor-pointer transition-colors"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Litigation Cases</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-serif font-bold text-slate-900 mt-2">{metrics.casesCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Suits on Docket</p>
        </div>

        <div 
          onClick={() => onNavigateSection('court_diary')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-500/50 cursor-pointer transition-colors"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Court Fixtures</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-serif font-bold text-slate-900 mt-2">{metrics.courtDatesCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Upcoming Hearings</p>
        </div>

        <div 
          onClick={() => onNavigateSection('properties')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-500/50 cursor-pointer transition-colors"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Properties</span>
            <Building2 className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-serif font-bold text-slate-900 mt-2">{metrics.propertiesCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{metrics.tenantsCount} Demised Tenants</p>
        </div>

        <div 
          onClick={() => onNavigateSection('billing')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-500/50 cursor-pointer transition-colors"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Verified Funds</span>
            <CreditCard className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-serif font-bold text-slate-900 mt-2">
            ₦{metrics.verifiedPaymentsTotal.toLocaleString('en-NG', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">{metrics.pendingPaymentsCount} Pending Verification</p>
        </div>
      </div>

      {/* Pending Approvals (for Principal Partner & Head of Chamber) */}
      {isPrincipalPartner && pendingApprovals.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-900">
              <ShieldAlert className="w-5 h-5 text-amber-700" />
              <h3 className="font-serif font-bold text-sm">
                Executive Action Required: Pending Principal Partner Approvals ({pendingApprovals.length})
              </h3>
            </div>
          </div>

          <div className="space-y-2">
            {pendingApprovals.map(req => (
              <div key={req.id} className="bg-white p-3.5 rounded-lg border border-amber-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    {req.requestType}
                  </span>
                  <p className="font-semibold text-xs text-slate-900 mt-1">{req.title}</p>
                  <p className="text-[11px] text-slate-600">{req.description}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Submitted by {req.requesterName} ({req.requesterRole})</p>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleApproveRequest(req.id, 'APPROVED')}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleApproveRequest(req.id, 'REJECTED')}
                    className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Counsel Pending Case Assignments (for Counsel / Staff) */}
      {counselAssignments.length > 0 && (
        <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-blue-900">
            <AlertCircle className="w-5 h-5 text-blue-700" />
            <h3 className="font-serif font-bold text-sm">
              Pending Case Assignments Awaiting Response ({counselAssignments.length})
            </h3>
          </div>

          <div className="space-y-2">
            {counselAssignments.map(asgn => (
              <div key={asgn.id} className="bg-white p-3.5 rounded-lg border border-blue-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <p className="font-bold text-xs text-slate-900">
                    Suit: <span className="font-mono text-blue-900">{asgn.suitNumber}</span>
                  </p>
                  <p className="text-[11px] text-slate-500">Assigned by {asgn.assignedByName} on {new Date(asgn.dateAssigned).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleRespondAssignment(asgn.id, 'ACCEPTED')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded"
                  >
                    Accept Assignment
                  </button>
                  <button
                    onClick={() => handleRespondAssignment(asgn.id, 'REJECTED')}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded"
                  >
                    Decline / Reassign
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two-Column Operational Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upcoming Court Dates */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <h3 className="font-serif font-bold text-sm text-slate-900">
                Upcoming Court Hearings & Fixtures
              </h3>
            </div>
            <button
              onClick={() => onNavigateSection('court_diary')}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center space-x-1"
            >
              <span>View Full Diary</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingCourtDates.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No upcoming court fixtures scheduled in the diary.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcomingCourtDates.map(entry => (
                <div key={entry.id} className="py-3 flex justify-between items-start text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-900">{entry.suitNumber}</span>
                    <p className="text-slate-600 text-[11px]">{entry.courtName}</p>
                    <p className="text-slate-500 text-[10px]">Purpose: {entry.purpose}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded">
                      {entry.courtDate}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">{entry.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Recent Audited Activities */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-600" />
              <h3 className="font-serif font-bold text-sm text-slate-900">
                Recent Chambers Audit Trail
              </h3>
            </div>
            <button
              onClick={() => onNavigateSection('administration')}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center space-x-1"
            >
              <span>Audits</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentAudits.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Audit log is clear.
            </div>
          ) : (
            <div className="space-y-3">
              {recentAudits.map(log => (
                <div key={log.id} className="text-xs space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-800">{log.userName}</span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-tight">{log.details}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assignment Rejection Modal */}
      {rejectingAssignmentId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-serif font-bold text-base text-slate-900">
              State Mandatory Reason for Declining Assignment
            </h3>
            <p className="text-xs text-slate-600">
              In accordance with Chambers policy, declination of a case assignment requires an official reason logged for Head of Chamber review.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason Category: *
              </label>
              <select
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value as CaseAssignment['rejectionReason'])}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="Existing workload">Existing workload</option>
                <option value="Court conflict">Court conflict</option>
                <option value="Leave">Leave</option>
                <option value="Conflict of interest">Conflict of interest</option>
                <option value="Unavailability">Unavailability</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Explanation Notes:
              </label>
              <textarea
                rows={3}
                value={rejectionNotes}
                onChange={e => setRejectionNotes(e.target.value)}
                placeholder="Detail court clash or conflict details..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setRejectingAssignmentId(null)}
                className="px-4 py-2 border rounded text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmRejection}
                className="px-4 py-2 bg-red-700 text-white rounded text-xs font-bold"
              >
                Submit Rejection & Request Reassignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Special Approval Request Modal */}
      {isSpecialApprovalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 animate-in fade-in duration-200">
            <div className="flex justify-between items-start pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-slate-900">
                    Request Special Approval
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Submitted to Head of Chamber · Escalatable to Principal Partner
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsSpecialApprovalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
              <p className="font-bold">Dual-Tier Chambers Authorization Workflow</p>
              <p className="text-[11px] text-amber-800">
                Your request is submitted first to the Head of Chamber. If the scope, expenditure, or legal implications exceed branch operational limits, the Head of Chamber will forward the docket to the Principal Partner, SAN for final executive determination.
              </p>
            </div>

            <form onSubmit={handleCreateSpecialApproval} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Approval Request Title: *
                </label>
                <input
                  type="text"
                  required
                  value={specialApprovalForm.title}
                  onChange={e => setSpecialApprovalForm({ ...specialApprovalForm, title: e.target.value })}
                  placeholder="e.g. Urgent Filing Fee Disbursement / Settlement Sanction"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Request Category:
                  </label>
                  <select
                    value={specialApprovalForm.requestType}
                    onChange={e => setSpecialApprovalForm({ ...specialApprovalForm, requestType: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Special Approval">Special Approval</option>
                    <option value="Head of Chamber Action">Head of Chamber Action</option>
                    <option value="Emergency Chamber Expenditure">Emergency Chamber Expenditure</option>
                    <option value="Settlement Proposal">Settlement Proposal</option>
                    <option value="Fee Adjustment">Fee Adjustment</option>
                    <option value="Notice of Premises">Notice of Premises</option>
                    <option value="Public Content Publication">Public Content Publication</option>
                    <option value="Invoice Billing Approval">Invoice Billing Approval</option>
                    <option value="Litigation Strategy">Litigation Strategy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority / Urgency:
                  </label>
                  <select
                    value={specialApprovalForm.urgency}
                    onChange={e => setSpecialApprovalForm({ ...specialApprovalForm, urgency: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High Priority</option>
                    <option value="Emergency / Critical">Emergency / Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Related Matter / Case / Invoice Reference (optional):
                </label>
                <input
                  type="text"
                  value={specialApprovalForm.referenceCode}
                  onChange={e => setSpecialApprovalForm({ ...specialApprovalForm, referenceCode: e.target.value })}
                  placeholder="e.g. MAT-2026-001 or FHC/ABJ/CS/401/2026"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:border-amber-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Justification & Details: *
                </label>
                <textarea
                  rows={4}
                  required
                  value={specialApprovalForm.description}
                  onChange={e => setSpecialApprovalForm({ ...specialApprovalForm, description: e.target.value })}
                  placeholder="State the circumstances, legal/financial rationale, and required executive action..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:border-amber-600 leading-relaxed"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSpecialApprovalModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to Head of Chamber</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
