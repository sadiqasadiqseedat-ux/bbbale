import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Building, 
  Users, 
  Shield, 
  Bell, 
  Clock, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Scale,
  Edit3,
  Trash2,
  X
} from 'lucide-react';
import { storageService, subscribeToStore } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { Branch, User, PublicNotice, AuditLog, ApprovalRequest } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const AdministrationView: React.FC = () => {
  const { currentUser, isPrincipalPartner } = useAuth();
  const [activeTab, setActiveTab] = useState<'branches' | 'users' | 'notices' | 'approvals' | 'audits'>('branches');

  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notices, setNotices] = useState<PublicNotice[]>([]);
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [branchActionError, setBranchActionError] = useState('');
  const [branchActionSuccess, setBranchActionSuccess] = useState('');
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);

  // New Branch Modal
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [branchForm, setBranchForm] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    isActive: true
  });

  // Edit Branch Modal
  const [isEditBranchOpen, setIsEditBranchOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [editBranchForm, setEditBranchForm] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    isActive: true
  });

  // New Notice Modal
  const [isAddNoticeOpen, setIsAddNoticeOpen] = useState(false);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    category: 'Public announcements' as PublicNotice['category'],
    content: '',
    status: 'Published' as PublicNotice['status']
  });

  const loadData = () => {
    setBranches(storageService.getBranches());
    setUsers(storageService.getUsers());
    setNotices(storageService.getPublicNotices());
    setAudits(storageService.getAuditLogs());
    setApprovals(storageService.getApprovals());
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStore(loadData);
    return () => unsub();
  }, []);

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.name || !branchForm.code || !currentUser) return;

    storageService.addBranch({
      name: branchForm.name,
      code: branchForm.code.toUpperCase(),
      address: branchForm.address,
      city: branchForm.city,
      state: branchForm.state,
      phone: branchForm.phone,
      email: branchForm.email,
      isActive: branchForm.isActive
    }, currentUser);

    setIsAddBranchOpen(false);
    setBranchForm({
      name: '',
      code: '',
      address: '',
      city: '',
      state: '',
      phone: '',
      email: '',
      isActive: true
    });
  };

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeForm.title || !noticeForm.content || !currentUser) return;

    storageService.addPublicNotice({
      title: noticeForm.title,
      category: noticeForm.category,
      content: noticeForm.content,
      status: noticeForm.status
    }, currentUser);

    setIsAddNoticeOpen(false);
    setNoticeForm({
      title: '',
      category: 'Public announcements',
      content: '',
      status: 'Published'
    });
  };

  const handleOpenEditBranch = (b: Branch) => {
    setSelectedBranch(b);
    setEditBranchForm({
      name: b.name,
      code: b.code,
      address: b.address,
      city: b.city,
      state: b.state,
      phone: b.phone,
      email: b.email,
      isActive: b.isActive
    });
    setBranchActionError('');
    setIsEditBranchOpen(true);
  };

  const handleSaveEditBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch || !currentUser) return;
    setBranchActionError('');

    storageService.updateBranch({
      ...selectedBranch,
      name: editBranchForm.name,
      code: editBranchForm.code.toUpperCase(),
      address: editBranchForm.address,
      city: editBranchForm.city,
      state: editBranchForm.state,
      phone: editBranchForm.phone,
      email: editBranchForm.email,
      isActive: editBranchForm.isActive
    }, currentUser);

    setBranchActionSuccess(`Branch "${editBranchForm.name}" updated successfully.`);
    setIsEditBranchOpen(false);
    setSelectedBranch(null);
    setTimeout(() => setBranchActionSuccess(''), 3000);
  };

  const handleDeleteBranch = (b: Branch) => {
    if (!currentUser) return;
    setBranchActionError('');
    setBranchToDelete(b);
  };

  const confirmDeleteBranch = (b: Branch) => {
    if (!currentUser) return;
    const res = storageService.deleteBranch(b.id, currentUser);
    if (res.success) {
      setBranchActionSuccess(`Branch "${b.name}" deleted.`);
      setTimeout(() => setBranchActionSuccess(''), 3000);
    } else {
      setBranchActionError(res.error || 'Failed to delete branch.');
    }
  };

  const handleDecideApproval = (reqId: string, status: 'APPROVED' | 'REJECTED') => {
    if (!currentUser) return;
    storageService.decideApproval(reqId, status, `Executive decision executed by ${currentUser.name}`, currentUser);
  };

  const filteredAudits = audits.filter(a => 
    a.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.entity.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Chambers Administration, Branches & Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Executive Governance · Branch Jurisdictions · Public Notice Board Manager · Immutable Audit Logs
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {isPrincipalPartner && (
            <button
              onClick={() => setIsAddBranchOpen(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Provision New Branch</span>
            </button>
          )}
          <button
            onClick={() => setIsAddNoticeOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Public Notice</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('branches')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'branches' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Branches ({branches.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'users' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Chambers Personnel ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('notices')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'notices' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Public Notices Manager ({notices.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('approvals')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'approvals' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Executive Approvals ({approvals.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('audits')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'audits' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Audit Trail ({audits.length})</span>
        </button>
      </div>

      {/* Branches Table */}
      {activeTab === 'branches' && (
        <div className="space-y-4">
          {branchActionSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{branchActionSuccess}</span>
            </div>
          )}
          {branchActionError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{branchActionError}</span>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Branch Code</th>
                    <th className="p-3.5">Chambers Name</th>
                    <th className="p-3.5">State & City</th>
                    <th className="p-3.5">Physical Address</th>
                    <th className="p-3.5">Phone & Official Email</th>
                    <th className="p-3.5">Status</th>
                    {isPrincipalPartner && <th className="p-3.5 text-right">Actions (Principal Partner)</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {branches.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-mono font-bold text-amber-900">{b.code}</td>
                      <td className="p-3.5 font-bold text-slate-900">{b.name}</td>
                      <td className="p-3.5 text-slate-700">{b.state} ({b.city})</td>
                      <td className="p-3.5 text-slate-600">{b.address}</td>
                      <td className="p-3.5 text-slate-600">
                        <p>{b.phone}</p>
                        <p className="text-[10px] text-slate-400">{b.email}</p>
                      </td>
                      <td className="p-3.5">
                        <span className={`font-bold px-2 py-0.5 rounded ${b.isActive ? 'text-emerald-800 bg-emerald-50' : 'text-slate-600 bg-slate-100'}`}>
                          {b.isActive ? 'Active Branch' : 'Inactive'}
                        </span>
                      </td>
                      {isPrincipalPartner && (
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEditBranch(b)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors"
                            title="Edit branch details"
                          >
                            <Edit3 className="w-3.5 h-3.5 inline mr-1" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteBranch(b)}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-[11px] font-semibold transition-colors"
                            title="Delete this branch"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                            <span>Delete</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Personnel Name</th>
                  <th className="p-3.5">System Role (5 Roles Only)</th>
                  <th className="p-3.5">Official Title</th>
                  <th className="p-3.5">Contact Details</th>
                  <th className="p-3.5">Public Availability</th>
                  <th className="p-3.5">Public Visibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3.5">
                      <div className="flex items-center space-x-3">
                        {u.photoUrl ? (
                          <img src={u.photoUrl} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-amber-900/10 border border-amber-600/30 flex items-center justify-center text-amber-900 font-bold text-xs shrink-0 font-serif">
                            {u.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('')}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-800">
                      <span className="bg-slate-100 px-2 py-0.5 rounded">{u.role}</span>
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">{u.title}</td>
                    <td className="p-3.5 text-slate-600">{u.phone}</td>
                    <td className="p-3.5">
                      <span className="text-[11px] font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded">
                        {u.availability.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-block font-bold text-[10px] px-2 py-0.5 rounded ${
                        u.isPubliclyVisible ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.isPubliclyVisible ? 'Published' : 'Internal Only'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Public Notices Manager */}
      {activeTab === 'notices' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Title</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Published Date</th>
                  <th className="p-3.5">Published By</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notices.map(n => (
                  <tr key={n.id} className="hover:bg-slate-50">
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{n.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{n.content}</p>
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">{n.category}</td>
                    <td className="p-3.5 text-slate-600 font-mono">{n.publishDate}</td>
                    <td className="p-3.5 text-slate-700">{n.publishedByName}</td>
                    <td className="p-3.5">
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        {n.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approvals */}
      {activeTab === 'approvals' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Request Type</th>
                  <th className="p-3.5">Title & Description</th>
                  <th className="p-3.5">Requester</th>
                  <th className="p-3.5">Date Submitted</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Principal Partner Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approvals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No executive approval requests logged.
                    </td>
                  </tr>
                ) : (
                  approvals.map(appr => (
                    <tr key={appr.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-slate-900">{appr.requestType}</td>
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-900">{appr.title}</p>
                        <p className="text-[11px] text-slate-500">{appr.description}</p>
                      </td>
                      <td className="p-3.5 text-slate-700">
                        {appr.requesterName} ({appr.requesterRole})
                      </td>
                      <td className="p-3.5 text-slate-600 font-mono">
                        {new Date(appr.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block font-bold text-[10px] px-2 py-0.5 rounded ${
                          appr.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          appr.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {appr.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1">
                        {appr.status === 'PENDING_PRINCIPAL_PARTNER_APPROVAL' && isPrincipalPartner ? (
                          <>
                            <button
                              onClick={() => handleDecideApproval(appr.id, 'APPROVED')}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded font-bold text-[11px]"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDecideApproval(appr.id, 'REJECTED')}
                              className="px-2.5 py-1 bg-red-600 text-white rounded font-bold text-[11px]"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">Decided</span>
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

      {/* Audit Trail */}
      {activeTab === 'audits' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center space-x-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search audit trail by actor, action, entity, or log details..."
              className="w-full text-xs bg-transparent border-none focus:outline-hidden"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Chambers Officer</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Action Executed</th>
                    <th className="p-3.5">Target Entity</th>
                    <th className="p-3.5">Audited Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAudits.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-900">{log.userName}</td>
                      <td className="p-3.5 font-mono text-slate-600">{log.userRole}</td>
                      <td className="p-3.5 font-bold text-amber-900">{log.action}</td>
                      <td className="p-3.5 text-slate-700">{log.entity}</td>
                      <td className="p-3.5 text-slate-600 max-w-sm">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Branch Modal */}
      {isAddBranchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-300">
            <h3 className="font-serif font-bold text-base text-slate-900 pb-2 border-b">
              Provision New Chambers Branch Office
            </h3>

            <form onSubmit={handleCreateBranch} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Branch Name: *</label>
                <input
                  type="text"
                  required
                  value={branchForm.name}
                  onChange={e => setBranchForm({ ...branchForm, name: e.target.value })}
                  placeholder="e.g. Benin City Chambers"
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch Code (3 letters): *</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={branchForm.code}
                    onChange={e => setBranchForm({ ...branchForm, code: e.target.value })}
                    placeholder="BEN"
                    className="w-full p-2.5 rounded border border-slate-300 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State: *</label>
                  <input
                    type="text"
                    required
                    value={branchForm.state}
                    onChange={e => setBranchForm({ ...branchForm, state: e.target.value })}
                    placeholder="Edo State"
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Physical Address: *</label>
                <input
                  type="text"
                  required
                  value={branchForm.address}
                  onChange={e => setBranchForm({ ...branchForm, address: e.target.value })}
                  placeholder="Street and building location"
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Phone: *</label>
                  <input
                    type="tel"
                    required
                    value={branchForm.phone}
                    onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })}
                    placeholder="+234 52 000 000"
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email: *</label>
                  <input
                    type="email"
                    required
                    value={branchForm.email}
                    onChange={e => setBranchForm({ ...branchForm, email: e.target.value })}
                    placeholder="benin@bbbalechambers.ng"
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddBranchOpen(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-amber-400 rounded font-bold"
                >
                  Authorize & Provision Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Branch Modal (Principal Partner Only) */}
      {isEditBranchOpen && selectedBranch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-300">
            <div className="flex justify-between items-start border-b pb-2">
              <div>
                <h3 className="font-serif font-bold text-base text-slate-900">
                  Edit Chambers Branch: {selectedBranch.name}
                </h3>
                <p className="text-[11px] text-slate-500">Executive modification reserved for Principal Partner.</p>
              </div>
              <button onClick={() => setIsEditBranchOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBranch} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch Name: *</label>
                  <input
                    type="text"
                    required
                    value={editBranchForm.name}
                    onChange={e => setEditBranchForm({ ...editBranchForm, name: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch Code: *</label>
                  <input
                    type="text"
                    required
                    value={editBranchForm.code}
                    onChange={e => setEditBranchForm({ ...editBranchForm, code: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300 uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State: *</label>
                  <input
                    type="text"
                    required
                    value={editBranchForm.state}
                    onChange={e => setEditBranchForm({ ...editBranchForm, state: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City / Division: *</label>
                  <input
                    type="text"
                    required
                    value={editBranchForm.city}
                    onChange={e => setEditBranchForm({ ...editBranchForm, city: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Physical Address: *</label>
                <input
                  type="text"
                  required
                  value={editBranchForm.address}
                  onChange={e => setEditBranchForm({ ...editBranchForm, address: e.target.value })}
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Phone: *</label>
                  <input
                    type="tel"
                    required
                    value={editBranchForm.phone}
                    onChange={e => setEditBranchForm({ ...editBranchForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Email: *</label>
                  <input
                    type="email"
                    required
                    value={editBranchForm.email}
                    onChange={e => setEditBranchForm({ ...editBranchForm, email: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={editBranchForm.isActive}
                    onChange={e => setEditBranchForm({ ...editBranchForm, isActive: e.target.checked })}
                    className="rounded text-amber-600"
                  />
                  <span className="font-semibold text-slate-700">Branch is Active & Operational</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditBranchOpen(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-amber-400 rounded font-bold shadow-xs hover:bg-slate-800"
                >
                  Save Branch Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Notice Modal */}
      {isAddNoticeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-300">
            <h3 className="font-serif font-bold text-base text-slate-900 pb-2 border-b">
              Publish Notice on Public Chambers Portal
            </h3>

            <form onSubmit={handleCreateNotice} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notice Title: *</label>
                <input
                  type="text"
                  required
                  value={noticeForm.title}
                  onChange={e => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  placeholder="e.g. Annual Court Vacation & Chambers Emergency Fixtures"
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notice Classification: *</label>
                <select
                  value={noticeForm.category}
                  onChange={e => setNoticeForm({ ...noticeForm, category: e.target.value as PublicNotice['category'] })}
                  className="w-full p-2.5 rounded border border-slate-300 bg-white"
                >
                  <option value="Office working hours">Office working hours</option>
                  <option value="Public announcements">Public announcements</option>
                  <option value="Holiday notices">Holiday notices</option>
                  <option value="Consultation availability">Consultation availability</option>
                  <option value="Approved service announcements">Approved service announcements</option>
                  <option value="Internship announcements">Internship announcements</option>
                  <option value="Chambers events">Chambers events</option>
                  <option value="Public legal information">Public legal information</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gazetted Notice Content: *</label>
                <textarea
                  required
                  rows={4}
                  value={noticeForm.content}
                  onChange={e => setNoticeForm({ ...noticeForm, content: e.target.value })}
                  placeholder="Official notice text as approved for publication..."
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddNoticeOpen(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Branch Deletion Dialog */}
      <ConfirmDialog
        isOpen={!!branchToDelete}
        title="Delete Branch Location"
        message={`Are you sure you want to permanently delete branch "${branchToDelete?.name}" (${branchToDelete?.code})? This executive action is reserved for the Principal Partner.`}
        confirmText="Permanently Delete"
        cancelText="Keep Branch"
        variant="danger"
        onConfirm={() => {
          if (branchToDelete) {
            confirmDeleteBranch(branchToDelete);
          }
        }}
        onClose={() => setBranchToDelete(null)}
      />
    </div>
  );
};
