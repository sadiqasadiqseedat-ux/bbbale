import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  FileText, 
  Plus, 
  Search, 
  User, 
  Calendar, 
  Scale, 
  Printer, 
  UserCheck, 
  AlertCircle,
  Eye,
  CheckCircle2,
  Clock,
  Trash2,
  X
} from 'lucide-react';
import { storageService, subscribeToStore } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { 
  Matter, 
  CaseRecord, 
  Court, 
  Client, 
  User as UserType, 
  CaseAssignment 
} from '../../types';
import { PrintDocumentModal, PrintableDocumentType } from '../common/PrintDocument';

export const MattersAndCasesView: React.FC = () => {
  const { 
    currentUser, 
    canAssignCases, 
    isCounselStaff, 
    isPrincipalPartner, 
    isHeadOfChamber 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'matters' | 'cases'>('cases');
  const [matters, setMatters] = useState<Matter[]>([]);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [lawyers, setLawyers] = useState<UserType[]>([]);
  const [assignments, setAssignments] = useState<CaseAssignment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected items
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [selectedMatter, setSelectedMatter] = useState<Matter | null>(null);
  const [printDoc, setPrintDoc] = useState<PrintableDocumentType | null>(null);

  // Deletion States & Authority Check
  const canDeleteLitigation = isPrincipalPartner || isHeadOfChamber;
  const [caseToDelete, setCaseToDelete] = useState<CaseRecord | null>(null);
  const [matterToDelete, setMatterToDelete] = useState<Matter | null>(null);
  const [isDeletingCase, setIsDeletingCase] = useState(false);
  const [isDeletingMatter, setIsDeletingMatter] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Case Modal
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [newCaseData, setNewCaseData] = useState({
    suitNumber: '',
    matterId: '',
    clientId: '',
    courtId: 'crt-03',
    judicialDivision: 'Abuja Judicial Division',
    judge: '',
    counselId: 'usr-counsel-01',
    opposingParty: '',
    opposingCounsel: '',
    caseType: 'Civil' as CaseRecord['caseType'],
    subjectMatter: '',
    filingDate: new Date().toISOString().split('T')[0],
    nextCourtDate: '',
    status: 'Pleadings' as CaseRecord['status'],
    clientVisibleUpdate: 'Writ of summons and statement of claim filed in court registry.',
    internalStrategyNotes: ''
  });

  // Reassignment Modal
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignCounselId, setReassignCounselId] = useState('');

  const loadData = () => {
    setMatters(storageService.getMatters());
    setCases(storageService.getCases());
    setCourts(storageService.getCourts());
    setClients(storageService.getClients());
    setLawyers(storageService.getUsers().filter(u => u.role === 'COUNSEL_STAFF' || u.role === 'HEAD_OF_CHAMBER' || u.role === 'PRINCIPAL_PARTNER'));
    setAssignments(storageService.getCaseAssignments());
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStore(loadData);
    return () => unsub();
  }, []);

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseData.suitNumber || !newCaseData.opposingParty || !currentUser) return;

    const created = storageService.addCase({
      suitNumber: newCaseData.suitNumber,
      matterId: newCaseData.matterId || (matters[0]?.id || 'mat-default'),
      clientId: newCaseData.clientId || (clients[0]?.id || 'cli-default'),
      courtId: newCaseData.courtId,
      judicialDivision: newCaseData.judicialDivision,
      judge: newCaseData.judge,
      counselId: newCaseData.counselId,
      opposingParty: newCaseData.opposingParty,
      opposingCounsel: newCaseData.opposingCounsel,
      caseType: newCaseData.caseType,
      subjectMatter: newCaseData.subjectMatter,
      filingDate: newCaseData.filingDate,
      nextCourtDate: newCaseData.nextCourtDate || undefined,
      status: newCaseData.status,
      clientVisibleUpdate: newCaseData.clientVisibleUpdate,
      internalStrategyNotes: newCaseData.internalStrategyNotes
    }, currentUser);

    setIsNewCaseOpen(false);
    setSelectedCase(created);
  };

  const handleReassign = () => {
    if (!selectedCase || !reassignCounselId || !currentUser) return;
    storageService.reassignCase(selectedCase.id, reassignCounselId, currentUser);
    setIsReassignModalOpen(false);
    setSelectedCase({ ...selectedCase, counselId: reassignCounselId });
  };

  const handleUpdateClientVisible = (updateText: string) => {
    if (!selectedCase || !currentUser) return;
    const updated = { ...selectedCase, clientVisibleUpdate: updateText };
    storageService.updateCase(updated, currentUser);
    setSelectedCase(updated);
  };

  const handleConfirmDeleteCase = async () => {
    if (!caseToDelete || !currentUser) return;
    setIsDeletingCase(true);
    setActionNotice(null);

    const deletedSuit = caseToDelete.suitNumber;
    const res = await storageService.deleteCase(caseToDelete.id, currentUser);
    setIsDeletingCase(false);

    if (res.success) {
      if (selectedCase?.id === caseToDelete.id) {
        setSelectedCase(null);
      }
      setCaseToDelete(null);
      setActionNotice({
        type: 'success',
        message: `Litigation cause "${deletedSuit}" has been permanently expunged from the docket and database.`
      });
      loadData();
    } else {
      setActionNotice({
        type: 'error',
        message: res.error || 'Failed to delete litigation case.'
      });
    }
  };

  const handleConfirmDeleteMatter = async () => {
    if (!matterToDelete || !currentUser) return;
    setIsDeletingMatter(true);
    setActionNotice(null);

    const deletedTitle = matterToDelete.title;
    const res = await storageService.deleteMatter(matterToDelete.id, currentUser);
    setIsDeletingMatter(false);

    if (res.success) {
      if (selectedMatter?.id === matterToDelete.id) {
        setSelectedMatter(null);
      }
      setMatterToDelete(null);
      setActionNotice({
        type: 'success',
        message: `Legal matter "${deletedTitle}" has been permanently deleted from Chambers records.`
      });
      loadData();
    } else {
      setActionNotice({
        type: 'error',
        message: res.error || 'Failed to delete legal matter.'
      });
    }
  };

  const filteredCases = cases.filter(c => {
    if (isCounselStaff && c.counselId !== currentUser?.id) return false;
    return c.suitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
           c.opposingParty.toLowerCase().includes(searchQuery.toLowerCase()) ||
           c.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
           c.subjectMatter.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredMatters = matters.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.matterId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Litigation, Suits & Legal Matters
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cause Tracking · Opposing Parties · Case Assignment Chain · Client Visible Updates
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {canAssignCases && (
            <button
              onClick={() => setIsNewCaseOpen(true)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>File New Litigation Cause</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('cases')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'cases'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Litigation Cases & Suits ({filteredCases.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('matters')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'matters'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>All Legal Matters & Retainers ({filteredMatters.length})</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by suit number (e.g. FHC/ABJ/CS/), opposing party, subject matter, or case code..."
          className="w-full text-xs sm:text-sm bg-transparent border-none focus:outline-hidden"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-600">
            Clear
          </button>
        )}
      </div>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-xs ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{actionNotice.message}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-2 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Cases View */}
      {activeTab === 'cases' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Suit Number</th>
                  <th className="p-3.5">Court & Division</th>
                  <th className="p-3.5">Opposing Party</th>
                  <th className="p-3.5">Assigned Counsel</th>
                  <th className="p-3.5">Next Hearing</th>
                  <th className="p-3.5">Litigation Stage</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No litigation cases found on the docket.
                    </td>
                  </tr>
                ) : (
                  filteredCases.map(c => {
                    const counsel = lawyers.find(l => l.id === c.counselId);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-slate-900 block">{c.suitNumber}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{c.caseId}</span>
                        </td>
                        <td className="p-3.5 text-slate-700">
                          <p className="font-medium">{c.judicialDivision}</p>
                          <p className="text-[10px] text-slate-400">{c.judge || 'Hon. Judge Presiding'}</p>
                        </td>
                        <td className="p-3.5 text-slate-800 font-medium">
                          vs {c.opposingParty}
                        </td>
                        <td className="p-3.5">
                          <span className="font-semibold text-slate-900 block">{counsel?.name || 'Assigned Counsel'}</span>
                          <span className="text-[10px] text-amber-800">{counsel?.title}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded">
                            {c.nextCourtDate || 'Adjourned Sine Die'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedCase(c)}
                            className="px-2.5 py-1 text-xs text-amber-700 hover:text-amber-900 font-semibold border border-amber-300 rounded hover:bg-amber-50 transition-colors"
                          >
                            Manage Suit
                          </button>
                          {canDeleteLitigation && (
                            <button
                              onClick={() => setCaseToDelete(c)}
                              className="px-2 py-1 text-xs text-rose-700 hover:text-rose-900 font-semibold border border-rose-300 rounded hover:bg-rose-50 transition-colors"
                              title="Permanently delete litigation cause from Chambers records"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                              <span>Delete</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Matters View */}
      {activeTab === 'matters' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Matter Code</th>
                  <th className="p-3.5">Title</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Stage</th>
                  <th className="p-3.5">Client Visible Update</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMatters.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No legal matters recorded.
                    </td>
                  </tr>
                ) : (
                  filteredMatters.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{m.matterId}</td>
                      <td className="p-3.5 font-semibold text-slate-900">{m.title}</td>
                      <td className="p-3.5 text-slate-600">{m.category}</td>
                      <td className="p-3.5 text-slate-700">{m.stage}</td>
                      <td className="p-3.5 text-slate-600 max-w-xs truncate">{m.clientVisibleUpdate}</td>
                      <td className="p-3.5">
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          {m.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedMatter(m)}
                          className="px-2.5 py-1 text-xs text-amber-700 hover:text-amber-900 font-semibold border border-amber-300 rounded hover:bg-amber-50 transition-colors"
                        >
                          View Details
                        </button>
                        {canDeleteLitigation && (
                          <button
                            onClick={() => setMatterToDelete(m)}
                            className="px-2 py-1 text-xs text-rose-700 hover:text-rose-900 font-semibold border border-rose-300 rounded hover:bg-rose-50 transition-colors"
                            title="Permanently delete legal matter"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                            <span>Delete</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Case Management Dossier Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto border border-slate-300">
            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono font-bold text-amber-700 uppercase">
                  {selectedCase.caseId}
                </span>
                <h2 className="text-xl font-serif font-bold text-slate-900 mt-0.5">
                  {selectedCase.suitNumber}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Opposing Party: vs {selectedCase.opposingParty} · Division: {selectedCase.judicialDivision}
                </p>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕ Close
              </button>
            </div>

            {/* Counsel Assignment Header & Reassignment Button */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
              <div>
                <span className="text-slate-500 font-bold uppercase">Counsel in Conduct:</span>
                <p className="text-slate-900 font-bold text-sm mt-0.5">
                  {lawyers.find(l => l.id === selectedCase.counselId)?.name || 'Assigned Counsel'}
                </p>
                <p className="text-slate-500 text-[11px]">
                  Presiding Judge: {selectedCase.judge || 'Hon. Judge Presiding'}
                </p>
              </div>

              {canAssignCases && (
                <button
                  onClick={() => {
                    setReassignCounselId(selectedCase.counselId);
                    setIsReassignModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-slate-900 text-amber-400 font-bold rounded hover:bg-slate-800 text-xs flex items-center space-x-1"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Reassign Counsel</span>
                </button>
              )}
            </div>

            {/* MANDATORY STRICT SEPARATION: Client Visible Update vs Privileged Notes */}
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 uppercase">
                    CLIENT VISIBLE PROGRESS UPDATE (Published on Client Portal & Tracking):
                  </span>
                  <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                    Client Accessible
                  </span>
                </div>
                <textarea
                  rows={2}
                  defaultValue={selectedCase.clientVisibleUpdate}
                  onBlur={e => handleUpdateClientVisible(e.target.value)}
                  className="w-full text-xs p-2.5 rounded border border-amber-300 bg-white"
                  placeholder="Enter update visible to client..."
                />
                <p className="text-[10px] text-amber-900 italic">
                  * Changes saved upon blur. Only approved, non-privileged case milestones must be entered here.
                </p>
              </div>

              <div className="p-4 bg-red-50/50 border border-red-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-950 uppercase flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 text-red-700" />
                    <span>INTERNAL PRIVILEGED TRIAL STRATEGY (STRICTLY PRIVILEGED & CONFIDENTIAL):</span>
                  </span>
                  <span className="text-[10px] font-bold bg-red-200 text-red-950 px-2 py-0.5 rounded">
                    Privileged & Confidential
                  </span>
                </div>
                <textarea
                  rows={3}
                  defaultValue={selectedCase.internalStrategyNotes}
                  onBlur={e => {
                    if (currentUser) {
                      const updated = { ...selectedCase, internalStrategyNotes: e.target.value };
                      storageService.updateCase(updated, currentUser);
                      setSelectedCase(updated);
                    }
                  }}
                  className="w-full text-xs p-2.5 rounded border border-red-200 bg-white"
                  placeholder="Record confidential trial notes, evidential objections, or litigation tactics..."
                />
                <p className="text-[10px] text-red-800">
                  CONFIDENTIALITY SAFEGUARD: Never exposed to clients or public tracking.
                </p>
              </div>
            </div>

            {/* Print & Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t border-slate-200">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPrintDoc({ type: 'CASE_SUMMARY', data: selectedCase })}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center space-x-2"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Print Case Summary</span>
                </button>
                {canDeleteLitigation && (
                  <button
                    onClick={() => {
                      setCaseToDelete(selectedCase);
                    }}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Suit</span>
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-500 font-mono">
                Next Hearing: {selectedCase.nextCourtDate || 'Not yet scheduled'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reassignment Modal */}
      {isReassignModalOpen && selectedCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-300">
            <h3 className="font-serif font-bold text-base text-slate-900 pb-2 border-b">
              Reassign Case {selectedCase.suitNumber}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              As assigning authority (Principal Partner / Head of Chamber), select the new counsel responsible for the conduct of this cause.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Assignee (Counsel, Head of Chamber, or Self):
              </label>
              <select
                value={reassignCounselId}
                onChange={e => setReassignCounselId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
              >
                {lawyers.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name} — {l.title} ({l.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                onClick={() => setIsReassignModalOpen(false)}
                className="px-4 py-2 border rounded text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleReassign}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Case Modal */}
      {isNewCaseOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto border border-slate-300">
            <div className="flex justify-between items-center pb-3 border-b">
              <h2 className="text-lg font-serif font-bold text-slate-900">
                File New Cause / Register Court Suit
              </h2>
              <button onClick={() => setIsNewCaseOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Suit Number: *</label>
                  <input
                    type="text"
                    required
                    value={newCaseData.suitNumber}
                    onChange={e => setNewCaseData({ ...newCaseData, suitNumber: e.target.value })}
                    placeholder="e.g. FHC/ABJ/CS/412/2026 or CV/189/2026"
                    className="w-full p-2.5 rounded border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Court: *</label>
                  <select
                    value={newCaseData.courtId}
                    onChange={e => setNewCaseData({ ...newCaseData, courtId: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300 bg-white"
                  >
                    {courts.map(crt => (
                      <option key={crt.id} value={crt.id}>{crt.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Judicial Division: *</label>
                  <input
                    type="text"
                    required
                    value={newCaseData.judicialDivision}
                    onChange={e => setNewCaseData({ ...newCaseData, judicialDivision: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Presiding Judge:</label>
                  <input
                    type="text"
                    value={newCaseData.judge}
                    onChange={e => setNewCaseData({ ...newCaseData, judge: e.target.value })}
                    placeholder="e.g. Hon. Justice I. M. Sani"
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Opposing Party: *</label>
                  <input
                    type="text"
                    required
                    value={newCaseData.opposingParty}
                    onChange={e => setNewCaseData({ ...newCaseData, opposingParty: e.target.value })}
                    placeholder="Defendant / Respondent Name"
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Opposing Counsel:</label>
                  <input
                    type="text"
                    value={newCaseData.opposingCounsel}
                    onChange={e => setNewCaseData({ ...newCaseData, opposingCounsel: e.target.value })}
                    placeholder="Opposing Law Firm or Counsel"
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Counsel: *</label>
                  <select
                    value={newCaseData.counselId}
                    onChange={e => setNewCaseData({ ...newCaseData, counselId: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300 bg-white"
                  >
                    {lawyers.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.role.replace('_', ' ')})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Next Court Date:</label>
                  <input
                    type="date"
                    value={newCaseData.nextCourtDate}
                    onChange={e => setNewCaseData({ ...newCaseData, nextCourtDate: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject Matter Overview: *</label>
                <textarea
                  required
                  rows={2}
                  value={newCaseData.subjectMatter}
                  onChange={e => setNewCaseData({ ...newCaseData, subjectMatter: e.target.value })}
                  placeholder="Concise legal issue, relief sought, declaratory orders..."
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">CLIENT VISIBLE UPDATE: *</label>
                <input
                  type="text"
                  required
                  value={newCaseData.clientVisibleUpdate}
                  onChange={e => setNewCaseData({ ...newCaseData, clientVisibleUpdate: e.target.value })}
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Internal Privileged Strategy Notes:</label>
                <textarea
                  rows={2}
                  value={newCaseData.internalStrategyNotes}
                  onChange={e => setNewCaseData({ ...newCaseData, internalStrategyNotes: e.target.value })}
                  placeholder="Privileged trial observations..."
                  className="w-full p-2.5 rounded border border-red-200 bg-red-50/20"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsNewCaseOpen(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold"
                >
                  File & Dispatch Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Matter Details Modal */}
      {selectedMatter && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto border border-slate-300 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono font-bold text-amber-700 uppercase">
                  {selectedMatter.matterId}
                </span>
                <h2 className="text-xl font-serif font-bold text-slate-900 mt-0.5">
                  {selectedMatter.title}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Category: {selectedMatter.category} · Stage: {selectedMatter.stage}
                </p>
              </div>
              <button
                onClick={() => setSelectedMatter(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-semibold">Matter Status:</span>
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded inline-block mt-0.5">
                    {selectedMatter.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Engagement Date:</span>
                  <span className="font-medium text-slate-800 block mt-0.5">
                    {selectedMatter.engagementDate || 'N/A'}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Client Visible Progress Update:</span>
                <p className="p-3 bg-blue-50/50 border border-blue-200 rounded text-slate-700">
                  {selectedMatter.clientVisibleUpdate || 'No public update published yet.'}
                </p>
              </div>

              {selectedMatter.privilegedInternalNotes && (
                <div>
                  <span className="font-bold text-red-950 block mb-1 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 text-red-700" />
                    <span>Confidential Internal Privileged Notes:</span>
                  </span>
                  <p className="p-3 bg-red-50/50 border border-red-200 rounded text-slate-700 whitespace-pre-wrap">
                    {selectedMatter.privilegedInternalNotes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              {canDeleteLitigation ? (
                <button
                  onClick={() => {
                    setMatterToDelete(selectedMatter);
                    setSelectedMatter(null);
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Permanently Delete Matter</span>
                </button>
              ) : <div />}

              <button
                onClick={() => setSelectedMatter(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Case Confirmation Modal */}
      {caseToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 border border-rose-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-slate-900">
                    Delete Litigation Cause
                  </h3>
                  <p className="text-xs text-rose-600 font-semibold">
                    Permanent Chambers Database Deletion
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCaseToDelete(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>Are you sure you want to permanently delete this court case and its litigation assignments?</p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                <p className="font-mono font-bold text-slate-900 text-sm">{caseToDelete.suitNumber}</p>
                <p className="text-slate-700 font-medium">vs {caseToDelete.opposingParty}</p>
                <p className="text-slate-500">{caseToDelete.judicialDivision} · Case Code: {caseToDelete.caseId}</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] space-y-1">
                <p className="font-bold flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Permanent Action Warning:</span>
                </p>
                <p>
                  This litigation cause will be permanently expunged from the Cloudflare D1 central database and docket.
                  Authorized by {isPrincipalPartner ? 'Principal Partner' : 'Head of Chamber'}.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingCase}
                onClick={() => setCaseToDelete(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 text-xs disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingCase}
                onClick={handleConfirmDeleteCase}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-xs text-xs flex items-center space-x-2 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingCase ? 'Deleting Case...' : 'Permanently Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Matter Confirmation Modal */}
      {matterToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 border border-rose-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-slate-900">
                    Delete Legal Matter
                  </h3>
                  <p className="text-xs text-rose-600 font-semibold">
                    Permanent Chambers Database Deletion
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMatterToDelete(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>Are you sure you want to permanently delete this legal matter record?</p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                <p className="font-bold text-slate-900 text-sm">{matterToDelete.title}</p>
                <p className="font-mono text-amber-800 text-[11px]">{matterToDelete.matterId}</p>
                <p className="text-slate-500">{matterToDelete.category} · Stage: {matterToDelete.stage}</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] space-y-1">
                <p className="font-bold flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Permanent Action Warning:</span>
                </p>
                <p>
                  This matter record will be permanently deleted from the Cloudflare D1 central database.
                  Authorized by {isPrincipalPartner ? 'Principal Partner' : 'Head of Chamber'}.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingMatter}
                onClick={() => setMatterToDelete(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 text-xs disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingMatter}
                onClick={handleConfirmDeleteMatter}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-xs text-xs flex items-center space-x-2 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingMatter ? 'Deleting Matter...' : 'Permanently Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {printDoc && (
        <PrintDocumentModal
          document={printDoc}
          onClose={() => setPrintDoc(null)}
        />
      )}
    </div>
  );
};
