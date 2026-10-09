import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Edit3, 
  KeyRound, 
  UserX, 
  UserCheck, 
  AlertTriangle, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  X, 
  Building, 
  Phone, 
  Mail, 
  Camera, 
  Briefcase,
  Copy,
  Clock,
  Filter,
  Trash2
} from 'lucide-react';
import { storageService, subscribeToStore } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { User, UserRole, AvailabilityStatus, AccountStatus, Branch } from '../../types';

export const UserManagementView: React.FC = () => {
  const { currentUser, isPrincipalPartner, isHeadOfChamber, isAdminSecretary } = useAuth();

  // Derived values — must be declared BEFORE any state that references them
  const userBranchId = currentUser?.branchId || 'br-abuja-01';
  const isBranchScoped = !isPrincipalPartner;
  const canManage = isPrincipalPartner || isHeadOfChamber || isAdminSecretary;
  const canCreateUsers = isPrincipalPartner || isHeadOfChamber;
  const canDeleteUsers = isPrincipalPartner || isHeadOfChamber;

  // Helper: Client-side photo compression to lightweight base64 JPEG (~30KB-50KB)
  const processProfilePhoto = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Selected file must be an image.'));
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Failed to parse image.'));
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDimension = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(reader.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Reset Password State
  const [generatedTempPassword, setGeneratedTempPassword] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    username: '',
    name: '',
    email: '',
    phone: '',
    role: 'COUNSEL_STAFF' as UserRole,
    branchId: userBranchId,
    title: '',
    practiceAreas: '',
    bio: '',
    photoUrl: '',
    initialPassword: 'admin@2026',
    requirePasswordChange: true,
    isPubliclyVisible: true
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'COUNSEL_STAFF' as UserRole,
    branchId: '',
    title: '',
    practiceAreas: '',
    bio: '',
    photoUrl: '',
    availability: 'AVAILABLE' as AvailabilityStatus,
    isPubliclyVisible: true,
    accountStatus: 'Active' as AccountStatus,
    requiresPasswordChange: false
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const loadData = () => {
    setUsers(storageService.getUsers());
    setBranches(storageService.getBranches());
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStore(loadData);
    return () => unsub();
  }, []);

  // Filtered Users — non-Principal Partner users are scoped to their own branch
  const scopedUsers = isBranchScoped ? users.filter(u => u.branchId === userBranchId) : users;

  const filteredUsers = scopedUsers.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery) ||
      u.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.accountStatus === statusFilter;
    const matchesBranch = isBranchScoped ? true : (branchFilter === 'ALL' || u.branchId === branchFilter);

    return matchesSearch && matchesRole && matchesStatus && matchesBranch;
  });

  if (!canManage) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center space-y-3">
        <ShieldAlert className="w-12 h-12 text-red-600 mx-auto" />
        <h2 className="font-serif text-lg font-bold text-red-900">Access Restricted: Authorized Administrators Only</h2>
        <p className="text-xs text-red-700 max-w-md mx-auto">
          User Account & Privilege Administration is restricted to the Principal Partner, Head of Chamber, and Administrator / Secretary.
        </p>
      </div>
    );
  }

  // Handle Create User
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!currentUser) return;

    if (!createForm.username || !createForm.name || !createForm.email || !createForm.phone) {
      setFormError('Please populate all mandatory fields (Username, Name, Email, Phone).');
      return;
    }

    // Role check for Head of Chamber
    if (isHeadOfChamber && createForm.role === 'PRINCIPAL_PARTNER') {
      setFormError('Head of Chamber cannot provision a Principal Partner account.');
      return;
    }

    const res = await storageService.createUserAccount({
      username: createForm.username.trim().toLowerCase(),
      name: createForm.name.trim(),
      email: createForm.email.trim().toLowerCase(),
      phone: createForm.phone.trim(),
      role: createForm.role,
      branchId: createForm.branchId,
      title: createForm.title.trim() || 'Chambers Legal Practitioner',
      practiceAreas: createForm.practiceAreas.split(',').map(s => s.trim()).filter(Boolean),
      bio: createForm.bio.trim() || 'Legal Practitioner at B. B. BALE & CO. CHAMBERS.',
      photoUrl: createForm.photoUrl.trim(),
      initialPassword: createForm.initialPassword.trim() || 'admin@2026',
      isPubliclyVisible: createForm.isPubliclyVisible,
      requiresPasswordChange: createForm.requirePasswordChange
    }, currentUser);

    if (res.success && res.user) {
      setFormSuccess(`User account created successfully for ${res.user.name} (${res.user.username}).`);
      setIsCreateOpen(false);
      setCreateForm({
        username: '',
        name: '',
        email: '',
        phone: '',
        role: 'COUNSEL_STAFF',
        branchId: userBranchId,
        title: '',
        practiceAreas: '',
        bio: '',
        photoUrl: '',
        initialPassword: 'admin@2026',
        requirePasswordChange: true,
        isPubliclyVisible: true
      });
    } else {
      setFormError(res.error || 'Failed to create user account.');
    }
  };

  // Open Edit Modal
  const openEditModal = (u: User) => {
    if (u.role === 'PRINCIPAL_PARTNER' && !isPrincipalPartner) {
      setActionNotice({ type: 'error', message: 'Unauthorized: Only the Principal Partner can modify the Principal Partner account.' });
      return;
    }
    setSelectedUser(u);
    setEditForm({
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      branchId: u.branchId,
      title: u.title,
      practiceAreas: u.practiceAreas.join(', '),
      bio: u.bio,
      photoUrl: u.photoUrl,
      availability: u.availability,
      isPubliclyVisible: u.isPubliclyVisible,
      accountStatus: u.accountStatus,
      requiresPasswordChange: u.requiresPasswordChange
    });
    setFormError('');
    setIsEditOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !currentUser) return;
    setFormError('');
    setFormSuccess('');

    // If Head of Chamber, cannot promote to Principal Partner
    if (
      isHeadOfChamber &&
      editForm.role === 'PRINCIPAL_PARTNER' &&
      selectedUser.role !== 'PRINCIPAL_PARTNER'
    ) {
      setFormError('Head of Chamber cannot assign the Principal Partner role.');
      return;
    }

    const updatedUser: User = {
      ...selectedUser,
      name: editForm.name.trim(),
      email: editForm.email.trim().toLowerCase(),
      phone: editForm.phone.trim(),
      role: editForm.role,
      branchId: editForm.branchId,
      title: editForm.title.trim(),
      practiceAreas: editForm.practiceAreas
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      bio: editForm.bio.trim(),
      photoUrl: editForm.photoUrl.trim(),
      availability: editForm.availability,
      isPubliclyVisible: editForm.isPubliclyVisible,
      accountStatus: editForm.accountStatus,
      isActive: editForm.accountStatus === 'Active',
      requiresPasswordChange: editForm.requiresPasswordChange
    };

    const res = await storageService.updateUserAccount(
      updatedUser,
      currentUser
    );

    if (res.success) {
      setFormSuccess(`User account for ${updatedUser.name} updated successfully.`);
      setSelectedUser(null);
      setIsEditOpen(false);
    } else {
      setFormError(res.error || 'Failed to update user account.');
    }
  };

  // Open Reset Password Modal
  const openResetModal = (u: User) => {
    if (u.role === 'PRINCIPAL_PARTNER' && !isPrincipalPartner) {
      setActionNotice({ type: 'error', message: 'Unauthorized: Only the Principal Partner can reset their own credentials.' });
      return;
    }
    setSelectedUser(u);
    setGeneratedTempPassword(null);
    setCopiedSuccess(false);
    setFormError('');
    setIsResetOpen(true);
  };

  // Execute Password Reset
  const handleExecuteReset = async () => {
    if (!selectedUser || !currentUser) return;
    const res = await storageService.adminResetUserPassword(selectedUser.id, currentUser);
    if (res.success && res.temporaryPassword) {
      setGeneratedTempPassword(res.temporaryPassword);
    } else {
      setFormError(res.error || 'Failed to reset password.');
    }
  };

  // Copy Temp Password
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  // Check if a specific target user can be permanently deleted by current logged-in user
  const canDeleteTarget = (u: User) => {
    if (!canDeleteUsers) return false;
    if (u.role === 'PRINCIPAL_PARTNER') return false;
    if (u.id === currentUser?.id) return false;
    if (isHeadOfChamber && u.role === 'HEAD_OF_CHAMBER') return false;
    return true;
  };

  // Quick Status Changes (Activate, Suspend)
  const handleQuickStatusChange = async (u: User, newStatus: AccountStatus) => {
    if (!currentUser) return;
    if (u.role === 'PRINCIPAL_PARTNER') {
      setActionNotice({ type: 'error', message: 'The Principal Partner account is permanently protected and cannot be deactivated or suspended.' });
      return;
    }
    const res = await storageService.setUserStatus(u.id, newStatus, currentUser);
    if (res.success) {
      setActionNotice({ type: 'success', message: `Account status for ${u.name} updated to "${newStatus}".` });
    } else {
      setActionNotice({ type: 'error', message: res.error || 'Failed to update user status.' });
    }
  };

  // Open Delete Confirmation Modal
  const openDeleteModal = (u: User) => {
    if (!canDeleteTarget(u)) {
      setActionNotice({ type: 'error', message: 'Unauthorized: Only the Principal Partner or Head of Chamber can delete user accounts.' });
      return;
    }
    setUserToDelete(u);
    setDeleteError('');
    setIsDeleteOpen(true);
  };

  // Execute Permanent Delete
  const handleConfirmDelete = async () => {
    if (!userToDelete || !currentUser) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      const res = await storageService.deleteUserAccount(userToDelete.id, currentUser);
      if (res.success) {
        setActionNotice({
          type: 'success',
          message: `User account for ${userToDelete.name} (@${userToDelete.username}) has been permanently deleted.`
        });
        setIsDeleteOpen(false);
        setUserToDelete(null);
      } else {
        setDeleteError(res.error || 'Failed to delete user account.');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Error occurred while deleting user.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick Availability Change
  const handleQuickAvailability = (u: User, newAvail: AvailabilityStatus) => {
    if (!currentUser) return;
    storageService.updateCounselAvailability(u.id, newAvail, currentUser);
  };

  // Quick Visibility Toggle
  const handleToggleVisibility = (u: User) => {
    if (!currentUser) return;
    storageService.updateUserAccount({
      ...u,
      isPubliclyVisible: !u.isPubliclyVisible
    }, currentUser);
  };

  // Quick Force Password Change Toggle
  const handleToggleForcePassword = (u: User) => {
    if (!currentUser) return;
    storageService.updateUserAccount({
      ...u,
      requiresPasswordChange: !u.requiresPasswordChange
    }, currentUser);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider font-mono">
              INTERNAL GOVERNANCE
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-medium">
              Authorized Authority: {isPrincipalPartner ? 'Principal Partner (Global — All Branches)' : isHeadOfChamber ? 'Head of Chamber (Branch-Scoped)' : 'Administrator / Secretary (Branch-Scoped)'}
            </span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 mt-1">
            User Account & Permissions Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Provision Chambers Personnel · Assign 5 Authorized Roles · Reset Passwords · Control Access & Visibility
          </p>
        </div>

        {canCreateUsers && (
          <button
            onClick={() => {
              setFormError('');
              setIsCreateOpen(true);
            }}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-2 transition-colors shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Provision New User Account</span>
          </button>
        )}
      </div>

      {actionNotice && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
          actionNotice.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <span>{actionNotice.message}</span>
          <button
            onClick={() => setActionNotice(null)}
            className="text-xs font-bold underline ml-4 hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Total Personnel</p>
          <p className="text-2xl font-serif font-bold text-slate-900 mt-1">{scopedUsers.length}</p>
          <p className="text-[10px] text-slate-400">{isBranchScoped ? 'Your Branch Accounts' : 'All Chambers Accounts'}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-700 uppercase">Active Accounts</p>
          <p className="text-2xl font-serif font-bold text-emerald-700 mt-1">
            {scopedUsers.filter(u => u.accountStatus === 'Active').length}
          </p>
          <p className="text-[10px] text-slate-400">Normal Authorized Access</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-amber-700 uppercase">Password Reset Req.</p>
          <p className="text-2xl font-serif font-bold text-amber-700 mt-1">
            {scopedUsers.filter(u => u.requiresPasswordChange).length}
          </p>
          <p className="text-[10px] text-slate-400">Pending First/Reset Login</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-red-700 uppercase">Suspended / Inactive</p>
          <p className="text-2xl font-serif font-bold text-red-700 mt-1">
            {scopedUsers.filter(u => u.accountStatus === 'Suspended' || u.accountStatus === 'Inactive').length}
          </p>
          <p className="text-[10px] text-slate-400">Blocked Access</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-blue-700 uppercase">Public Profiles</p>
          <p className="text-2xl font-serif font-bold text-blue-700 mt-1">
            {scopedUsers.filter(u => u.isPubliclyVisible).length}
          </p>
          <p className="text-[10px] text-slate-400">Visible on Public Site</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search personnel by name, username, official email, phone, or title..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-600 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="ALL">All Roles (5 Authorized)</option>
            <option value="PRINCIPAL_PARTNER">1. Principal Partner</option>
            <option value="HEAD_OF_CHAMBER">2. Head of Chamber</option>
            <option value="ADMINISTRATOR_SECRETARY">3. Administrator / Secretary</option>
            <option value="ACCOUNT_OFFICER">4. Account Officer</option>
            <option value="COUNSEL_STAFF">5. Counsel / Staff</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="ALL">All Account Statuses</option>
            <option value="Active">Active</option>
            <option value="Password Reset Required">Password Reset Required</option>
            <option value="Suspended">Suspended</option>
            <option value="Inactive">Inactive</option>
          </select>

          {!isBranchScoped && (
            <select
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 font-medium focus:outline-hidden"
            >
              <option value="ALL">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="p-3.5">Personnel Profile</th>
                <th className="p-3.5">Assigned Role (5 Roles)</th>
                <th className="p-3.5">Branch Jurisdiction</th>
                <th className="p-3.5">Account Status</th>
                <th className="p-3.5">Availability</th>
                <th className="p-3.5">Public Site</th>
                <th className="p-3.5">First Login / Reset</th>
                <th className="p-3.5 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No personnel accounts match the specified criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const branchObj = branches.find(b => b.id === u.branchId);
                  const isProtectedPrincipal = u.role === 'PRINCIPAL_PARTNER';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Profile Column */}
                      <td className="p-3.5">
                        <div className="flex items-start space-x-3">
                          {u.photoUrl ? (
                            <img
                              src={u.photoUrl}
                              alt={u.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-amber-900/10 border border-amber-600/30 flex items-center justify-center text-amber-900 font-bold text-xs shrink-0 font-serif">
                              {u.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('')}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-slate-900 truncate">{u.name}</span>
                              {isProtectedPrincipal && (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded border border-amber-300">
                                  SAN
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-amber-900 font-mono font-semibold">@{u.username}</p>
                            <p className="text-[10px] text-slate-500 truncate">{u.title}</p>
                            <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                              <span>{u.email}</span>
                              <span>·</span>
                              <span>{u.phone}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Column */}
                      <td className="p-3.5">
                        <span className={`inline-block font-mono font-bold text-[10px] px-2 py-0.5 rounded border ${
                          u.role === 'PRINCIPAL_PARTNER' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                          u.role === 'HEAD_OF_CHAMBER' ? 'bg-purple-100 text-purple-900 border-purple-300' :
                          u.role === 'ADMINISTRATOR_SECRETARY' ? 'bg-blue-100 text-blue-900 border-blue-300' :
                          u.role === 'ACCOUNT_OFFICER' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                          'bg-slate-100 text-slate-800 border-slate-300'
                        }`}>
                          {u.role.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Branch Column */}
                      <td className="p-3.5 text-slate-700">
                        <p className="font-medium">{branchObj ? branchObj.name : 'Abuja Head Chambers'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{branchObj ? branchObj.code : 'ABJ'}</p>
                      </td>

                      {/* Account Status Column */}
                      <td className="p-3.5">
                        <span className={`inline-flex items-center space-x-1 font-bold text-[10px] px-2 py-0.5 rounded ${
                          u.accountStatus === 'Active' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          u.accountStatus === 'Password Reset Required' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          u.accountStatus === 'Suspended' ? 'bg-red-50 text-red-800 border border-red-200' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            u.accountStatus === 'Active' ? 'bg-emerald-600' :
                            u.accountStatus === 'Password Reset Required' ? 'bg-amber-600' :
                            u.accountStatus === 'Suspended' ? 'bg-red-600' :
                            'bg-slate-400'
                          }`} />
                          <span>{u.accountStatus}</span>
                        </span>
                      </td>

                      {/* Availability Column */}
                      <td className="p-3.5">
                        <select
                          value={u.availability}
                          onChange={e => handleQuickAvailability(u, e.target.value as AvailabilityStatus)}
                          className="text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-slate-700 cursor-pointer focus:outline-hidden"
                        >
                          <option value="AVAILABLE">AVAILABLE</option>
                          <option value="IN_COURT">IN COURT</option>
                          <option value="IN_OFFICE">IN OFFICE</option>
                          <option value="BUSY">BUSY</option>
                          <option value="ON_LEAVE">ON LEAVE</option>
                          <option value="OUT_OF_OFFICE">OUT OF OFFICE</option>
                        </select>
                      </td>

                      {/* Public Visibility Column */}
                      <td className="p-3.5">
                        <button
                          onClick={() => handleToggleVisibility(u)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
                            u.isPubliclyVisible 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                          title="Click to toggle public directory listing"
                        >
                          {u.isPubliclyVisible ? 'Publicly Visible' : 'Internal Only'}
                        </button>
                      </td>

                      {/* Force Password Change Column */}
                      <td className="p-3.5">
                        <button
                          onClick={() => handleToggleForcePassword(u)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
                            u.requiresPasswordChange
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                          }`}
                          title="Click to toggle required password change"
                        >
                          {u.requiresPasswordChange ? 'Mandatory Change' : 'Normal Access'}
                        </button>
                      </td>

                      {/* Administrative Actions */}
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(u)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors"
                          title="Edit user details, roles, branch, photo"
                        >
                          <Edit3 className="w-3.5 h-3.5 inline mr-1" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => openResetModal(u)}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-[11px] font-semibold border border-amber-200 transition-colors"
                          title="Reset user password"
                        >
                          <KeyRound className="w-3.5 h-3.5 inline mr-1" />
                          <span>Reset Pwd</span>
                        </button>

                        {/* Status Actions */}
                        {!isProtectedPrincipal && (
                          <>
                            {u.accountStatus === 'Active' ? (
                              <button
                                onClick={() => handleQuickStatusChange(u, 'Suspended')}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-[11px] font-semibold border border-amber-200 transition-colors"
                                title="Suspend user account access"
                              >
                                <UserX className="w-3.5 h-3.5 inline mr-1" />
                                <span>Suspend</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleQuickStatusChange(u, 'Active')}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[11px] font-semibold border border-emerald-200 transition-colors"
                                title="Activate user account access"
                              >
                                <UserCheck className="w-3.5 h-3.5 inline mr-1" />
                                <span>Activate</span>
                              </button>
                            )}
                          </>
                        )}

                        {/* Complete Account Deletion */}
                        {canDeleteTarget(u) && (
                          <button
                            onClick={() => openDeleteModal(u)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[11px] font-semibold border border-rose-200 transition-colors"
                            title="Permanently delete user account from Chambers database"
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

      {/* CREATE USER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 my-8 border border-slate-300 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-xl font-serif font-bold text-slate-900">
                  Provision New Chambers Personnel Account
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Establish an authorized Chambers database account with strictly defined role permissions.
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Username */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Chambers Username: *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.username}
                    onChange={e => setCreateForm({ ...createForm, username: e.target.value })}
                    placeholder="e.g. counsel.tunde or babatunde.ade"
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-xs focus:outline-hidden focus:border-amber-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Unique identifier used during Chambers login.</p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Official Full Name & Title: *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g. Barrister Babatunde Adeleke, BL"
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-amber-600"
                  />
                </div>

                {/* Official Email */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Official Email Address: *
                  </label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="e.g. counsel@bbbalechambers.ng"
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-amber-600"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Official Telephone: *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.phone}
                    onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="e.g. +234 803 000 0000"
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-amber-600"
                  />
                </div>

                {/* Role Assignment (The only 5 authorized roles) */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Chambers Role (5 Roles Only): *
                  </label>
                  <select
                    value={createForm.role}
                    onChange={e => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-semibold text-slate-800 text-xs focus:outline-hidden focus:border-amber-600"
                  >
                    {isPrincipalPartner && (
                      <option value="PRINCIPAL_PARTNER">1. Principal Partner (Supreme Authority)</option>
                    )}
                    <option value="HEAD_OF_CHAMBER">2. Head of Chamber (Branch Operational Leader)</option>
                    <option value="ADMINISTRATOR_SECRETARY">3. Administrator / Secretary (Site Content & Intake)</option>
                    <option value="ACCOUNT_OFFICER">4. Account Officer (Financial & Invoices)</option>
                    <option value="COUNSEL_STAFF">5. Counsel / Staff (Litigation & Matters)</option>
                  </select>
                </div>

                {/* Branch Assignment */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Chambers Branch: *
                  </label>
                  <select
                    value={createForm.branchId}
                    onChange={e => setCreateForm({ ...createForm, branchId: e.target.value })}
                    disabled={isBranchScoped}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-amber-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    {isBranchScoped ? (
                      <option value={userBranchId}>
                        {branches.find(b => b.id === userBranchId)?.name || 'Your Branch'} ({branches.find(b => b.id === userBranchId)?.state || ''})
                      </option>
                    ) : (
                      branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.state})</option>
                      ))
                    )}
                  </select>
                  {isBranchScoped && (
                    <p className="text-[10px] text-slate-400 mt-1">Locked to your assigned branch.</p>
                  )}
                </div>

                {/* Official Title */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Designation / Chambers Title:
                  </label>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                    placeholder="e.g. Senior Associate, Associate Counsel, Legal Secretary"
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-amber-600"
                  />
                </div>

                {/* Practice Areas */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Practice Competencies (comma separated):
                  </label>
                  <input
                    type="text"
                    value={createForm.practiceAreas}
                    onChange={e => setCreateForm({ ...createForm, practiceAreas: e.target.value })}
                    placeholder="e.g. Commercial Litigation, Real Estate, Recovery of Premises, Arbitration"
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-amber-600"
                  />
                </div>

                {/* Photo Upload from Device */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Profile Photograph (Upload from Device):
                  </label>
                  <div className="flex items-center space-x-3">
                    {createForm.photoUrl ? (
                      <img
                        src={createForm.photoUrl}
                        alt="Preview"
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        <Camera className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) {
                            setFormError(`Image file (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 5MB size limit.`);
                            e.target.value = '';
                            return;
                          }
                          try {
                            const compressed = await processProfilePhoto(file);
                            setCreateForm(prev => ({
                              ...prev,
                              photoUrl: compressed
                            }));
                          } catch (err: any) {
                            setFormError(err.message || 'Failed to process image');
                          }
                        }}
                        className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-amber-100 file:text-amber-800 file:font-semibold file:cursor-pointer"
                      />
                      {createForm.photoUrl && (
                        <button
                          type="button"
                          onClick={() => setCreateForm(prev => ({ ...prev, photoUrl: '' }))}
                          className="mt-1 text-[11px] text-rose-600 hover:text-rose-800 underline font-medium block"
                        >
                          Remove photo
                        </button>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">Select a photo from your computer or device. Automatically optimized for Chambers profile.</p>
                    </div>
                  </div>
                </div>

                {/* Initial Setup Password */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Initial Setup Password:
                  </label>
                  <input
                    type="text"
                    value={createForm.initialPassword}
                    onChange={e => setCreateForm({ ...createForm, initialPassword: e.target.value })}
                    placeholder="admin@2026"
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-xs focus:outline-hidden focus:border-amber-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Default: admin@2026</p>
                </div>

                {/* Checkboxes */}
                <div className="sm:col-span-2 pt-2 space-y-2 border-t border-slate-100">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createForm.requirePasswordChange}
                      onChange={e => setCreateForm({ ...createForm, requirePasswordChange: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-slate-700 font-medium">Force "Change Your Password" upon first login (Recommended)</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createForm.isPubliclyVisible}
                      onChange={e => setCreateForm({ ...createForm, isPubliclyVisible: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-slate-700 font-medium">Publish profile in public Counsel Directory & Availability Board</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs transition-colors"
                >
                  Create & Authorize Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {isEditOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 my-8 border border-slate-300 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-xl font-serif font-bold text-slate-900">
                  Edit Personnel: {selectedUser.name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update account parameters, branch, roles, contact info, and availability.
                </p>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Chambers Username (Permanent Identifier):
                  </label>
                  <input
                    type="text"
                    disabled
                    value={selectedUser.username}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-100 font-mono text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Official Full Name: *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Official Email: *
                  </label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Official Phone: *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-amber-600"
                  />
                </div>

                {/* Role Assignment */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Role: *
                  </label>
                  <select
                    disabled={selectedUser.role === 'PRINCIPAL_PARTNER' || isAdminSecretary}
                    value={editForm.role}
                    onChange={e => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-semibold text-slate-800 text-xs focus:outline-hidden focus:border-amber-600 disabled:bg-slate-100"
                  >
                    {isPrincipalPartner && (
                      <option value="PRINCIPAL_PARTNER">1. Principal Partner</option>
                    )}
                    <option value="HEAD_OF_CHAMBER">2. Head of Chamber</option>
                    <option value="ADMINISTRATOR_SECRETARY">3. Administrator / Secretary</option>
                    <option value="ACCOUNT_OFFICER">4. Account Officer</option>
                    <option value="COUNSEL_STAFF">5. Counsel / Staff</option>
                  </select>
                </div>

                {/* Branch */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Branch: *
                  </label>
                  <select
                    value={editForm.branchId}
                    onChange={e => setEditForm({ ...editForm, branchId: e.target.value })}
                    disabled={isBranchScoped}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-amber-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    {isBranchScoped ? (
                      <option value={userBranchId}>
                        {branches.find(b => b.id === userBranchId)?.name || 'Your Branch'} ({branches.find(b => b.id === userBranchId)?.state || ''})
                      </option>
                    ) : (
                      branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.state})</option>
                      ))
                    )}
                  </select>
                </div>

                {/* Availability */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Availability Status:
                  </label>
                  <select
                    value={editForm.availability}
                    onChange={e => setEditForm({ ...editForm, availability: e.target.value as AvailabilityStatus })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-amber-600"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="IN_COURT">IN COURT</option>
                    <option value="IN_OFFICE">IN OFFICE</option>
                    <option value="BUSY">BUSY</option>
                    <option value="ON_LEAVE">ON LEAVE</option>
                    <option value="OUT_OF_OFFICE">OUT OF OFFICE</option>
                  </select>
                </div>

                {/* Account Status */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Account Status:
                  </label>
                  <select
                    disabled={selectedUser.role === 'PRINCIPAL_PARTNER'}
                    value={editForm.accountStatus}
                    onChange={e => setEditForm({ ...editForm, accountStatus: e.target.value as AccountStatus })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-semibold text-xs focus:outline-hidden focus:border-amber-600 disabled:bg-slate-100"
                  >
                    <option value="Active">Active</option>
                    <option value="Password Reset Required">Password Reset Required</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Official Title */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Designation / Title:
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-amber-600"
                  />
                </div>

                {/* Practice Areas */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Practice Areas (comma separated):
                  </label>
                  <input
                    type="text"
                    value={editForm.practiceAreas}
                    onChange={e => setEditForm({ ...editForm, practiceAreas: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-amber-600"
                  />
                </div>

                {/* Photo Upload from Device */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Profile Photograph (Upload from Device):
                  </label>
                  <div className="flex items-center space-x-3">
                    {editForm.photoUrl ? (
                      <img
                        src={editForm.photoUrl}
                        alt="Preview"
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        <Camera className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) {
                            setFormError(`Image file (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 5MB size limit.`);
                            e.target.value = '';
                            return;
                          }
                          try {
                            const compressed = await processProfilePhoto(file);
                            setEditForm(prev => ({ ...prev, photoUrl: compressed }));
                          } catch (err: any) {
                            setFormError(err.message || 'Failed to process image');
                          }
                        }}
                        className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-amber-100 file:text-amber-800 file:font-semibold file:cursor-pointer"
                      />
                      {editForm.photoUrl && (
                        <button
                          type="button"
                          onClick={() => setEditForm(prev => ({ ...prev, photoUrl: '' }))}
                          className="mt-1 text-[11px] text-rose-600 hover:text-rose-800 underline font-medium block"
                        >
                          Remove photo
                        </button>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">Select a photo from your computer or device. Automatically optimized for Chambers profile.</p>
                    </div>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="sm:col-span-2 pt-2 space-y-2 border-t border-slate-100">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.requiresPasswordChange}
                      onChange={e => setEditForm({ ...editForm, requiresPasswordChange: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-slate-700 font-medium">Require "Change Your Password" on next login</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.isPubliclyVisible}
                      onChange={e => setEditForm({ ...editForm, isPubliclyVisible: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-slate-700 font-medium">Publicly visible on Chambers Website & Counsel Directory</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs transition-colors"
                >
                  Save Account Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {isResetOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 border border-slate-300 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto border border-amber-300">
                <KeyRound className="w-6 h-6 text-amber-700" />
              </div>
              <h2 className="text-xl font-serif font-bold text-slate-900">
                Administrative Password Reset
              </h2>
              <p className="text-xs text-slate-600">
                Generate a temporary credentials passkey for <strong>{selectedUser.name}</strong> (@{selectedUser.username}).
              </p>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {!generatedTempPassword ? (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 space-y-1.5">
                  <p className="font-semibold text-slate-800">Security Consequences:</p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px]">
                    <li>The existing password will be invalidated immediately.</li>
                    <li>A temporary secure password will be provisioned.</li>
                    <li>The user will be strictly forced to <strong>CHANGE THEIR PASSWORD</strong> upon next login before dashboard access.</li>
                    <li>This action is permanently recorded in the immutable Chambers Audit Trail.</li>
                  </ul>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetOpen(false)}
                    className="px-4 py-2 border rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteReset}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-xs transition-colors"
                  >
                    Confirm & Generate Passkey
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Temporary Password Provisioned Successfully</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      Temporary Setup Password:
                    </label>
                    <div className="flex items-center space-x-2 mt-1">
                      <input
                        type="text"
                        readOnly
                        value={generatedTempPassword}
                        className="flex-1 p-2.5 bg-white border border-emerald-300 rounded-lg font-mono font-bold text-sm text-slate-900 select-all"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(generatedTempPassword)}
                        className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center space-x-1"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                        <span>{copiedSuccess ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-tight">
                    Securely communicate this passkey to {selectedUser.name}. Upon signing in, the system will immediately require them to establish their personal private password.
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetOpen(false);
                      setGeneratedTempPassword(null);
                    }}
                    className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-lg font-bold shadow-xs"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteOpen && userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-5 my-8 border border-rose-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-serif font-bold text-slate-900">
                    Delete User Account
                  </h2>
                  <p className="text-xs text-rose-600 font-semibold">
                    Permanent Chambers Database Deletion
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isDeleting) {
                    setIsDeleteOpen(false);
                    setUserToDelete(null);
                  }
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                Are you sure you want to permanently delete the personnel account for:
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 text-sm">{userToDelete.name}</span>
                </div>
                <p className="font-mono text-amber-800 text-[11px]">@{userToDelete.username}</p>
                <p className="text-slate-500 text-[11px]">{userToDelete.title} · {userToDelete.role.replace(/_/g, ' ')}</p>
                <p className="text-slate-500 text-[11px]">{userToDelete.email}</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] space-y-1">
                <p className="font-bold flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Permanent Action Warning:</span>
                </p>
                <p>
                  This will completely remove the user record and invalidate all active authentication sessions.
                  Authorized by {isPrincipalPartner ? 'Principal Partner' : 'Head of Chamber'}.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setIsDeleteOpen(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 text-xs disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-xs text-xs flex items-center space-x-2 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting Account...' : 'Permanently Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
