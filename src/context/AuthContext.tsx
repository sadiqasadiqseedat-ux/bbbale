import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Branch, UserRole, UserSession } from '../types';
import { storageService, subscribeToStore, initializeStorage, logAudit } from '../services/storage';

interface AuthContextType {
  currentUser: User | null;
  session: UserSession | null;
  isAuthenticated: boolean;
  requiresPasswordChange: boolean;
  activeBranchId: string;
  isAllBranches: boolean;
  branches: Branch[];
  users: User[];
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string; requiresPasswordChange?: boolean }>;
  logout: () => void;
  switchAccount: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (identifier: string) => { success: boolean; message: string; resetToken?: string };
  completePasswordReset: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  setActiveBranchId: (branchId: string) => void;
  isPrincipalPartner: boolean;
  isHeadOfChamber: boolean;
  isAdminSecretary: boolean;
  isAccountOfficer: boolean;
  isCounselStaff: boolean;
  canManageFirm: boolean;
  canManageUsers: boolean;
  canManageWebsite: boolean;
  canAssignCases: boolean;
  canVerifyPayments: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeBranchId, setActiveBranchIdState] = useState<string>('br-abuja-01');
  const [isAllBranches, setIsAllBranches] = useState<boolean>(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const loadData = async () => {
    await initializeStorage();
    const allUsers = storageService.getUsers();
    const allBranches = storageService.getBranches();
    setUsers(allUsers);
    setBranches(allBranches);

    const currentSession = storageService.getCurrentSession();
    if (currentSession) {
      const user = allUsers.find(u => u.id === currentSession.userId);
      if (user && user.isActive && user.accountStatus !== 'Suspended') {
        setCurrentUser(user);
        setSession(currentSession);
        if (user.role === 'PRINCIPAL_PARTNER') {
          setActiveBranchIdState(storageService.getActiveBranchId());
        } else {
          setActiveBranchIdState(user.branchId);
          setIsAllBranches(false);
        }
      } else {
        storageService.logoutUser();
        setCurrentUser(null);
        setSession(null);
      }
    } else {
      setCurrentUser(null);
      setSession(null);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToStore(() => {
      const allUsers = storageService.getUsers();
      setUsers(allUsers);
      setBranches(storageService.getBranches());
      const currentSession = storageService.getCurrentSession();
      if (currentSession) {
        const u = allUsers.find(usr => usr.id === currentSession.userId);
        if (u) setCurrentUser(u);
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async (identifier: string, password: string, rememberMe: boolean = false) => {
    const result = await storageService.authenticateUser(identifier, password, rememberMe);
    if (result.success && result.user && result.session) {
      setCurrentUser(result.user);
      setSession(result.session);
      setActiveBranchIdState(result.user.branchId || 'br-abuja-01');
      return { 
        success: true, 
        requiresPasswordChange: result.user.requiresPasswordChange 
      };
    }
    return { 
      success: false, 
      error: result.error || 'Authentication failed. Please verify credentials.' 
    };
  };

  const logout = () => {
    storageService.logoutUser(currentUser || undefined);
    setCurrentUser(null);
    setSession(null);
  };

  const switchAccount = (userId: string) => {
    const target = storageService.getUserById(userId);
    if (!target) return;
    const session: UserSession = {
      userId: target.id,
      token: `session-${Date.now()}`,
      role: target.role,
      branchId: target.branchId,
      rememberMe: true,
      expiresAt: new Date(Date.now() + 86400000).toISOString()
    };
    storageService.setUserSession(session);
    setCurrentUser(target);
    setSession(session);
    setActiveBranchIdState(target.role === 'PRINCIPAL_PARTNER' ? storageService.getActiveBranchId() : target.branchId);
    logAudit(target, 'SWITCH_ACCOUNT', 'Session', target.id, `User session switched to ${target.name} (${target.role})`);
  };

  const switchRole = (role: UserRole) => {
    const allUsers = storageService.getUsers();
    const target = allUsers.find(u => u.role === role);
    if (target) {
      switchAccount(target.id);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!currentUser) return { success: false, error: 'No active session' };
    const res = await storageService.changePassword(currentUser.id, currentPassword, newPassword);
    if (res.success) {
      // Reload updated user
      const updated = storageService.getUserById(currentUser.id);
      if (updated) setCurrentUser(updated);
    }
    return res;
  };

  const requestPasswordReset = (identifier: string) => {
    return storageService.requestPasswordReset(identifier);
  };

  const completePasswordReset = async (token: string, newPassword: string) => {
    return storageService.completePasswordResetWithToken(token, newPassword);
  };

  const setActiveBranchId = (branchId: string) => {
    if (currentUser?.role !== 'PRINCIPAL_PARTNER') return;
    if (branchId === 'ALL_BRANCHES') {
      setIsAllBranches(true);
      setActiveBranchIdState('ALL_BRANCHES');
    } else {
      setIsAllBranches(false);
      setActiveBranchIdState(branchId);
      storageService.setActiveBranchId(branchId);
    }
  };

  const isPrincipalPartner = currentUser?.role === 'PRINCIPAL_PARTNER';
  const isHeadOfChamber = currentUser?.role === 'HEAD_OF_CHAMBER';
  const isAdminSecretary = currentUser?.role === 'ADMINISTRATOR_SECRETARY';
  const isAccountOfficer = currentUser?.role === 'ACCOUNT_OFFICER';
  const isCounselStaff = currentUser?.role === 'COUNSEL_STAFF';

  // Role permissions per guidelines:
  // Principal Partner: Highest authority, all branches, all user management, all content
  // Head of Chamber: Branch operational authority, user management (except Principal Partner), full website content
  // Administrator / Secretary: Broad website & content control, intake, administration (no user role modification)
  // Account Officer: Authorized billing & financial verification
  // Counsel / Staff: Assigned cases, tasks, court dates, availability
  const canManageFirm = isPrincipalPartner;
  const canManageUsers = isPrincipalPartner || isHeadOfChamber || isAdminSecretary;
  const canManageWebsite = isPrincipalPartner || isHeadOfChamber || isAdminSecretary;
  const canAssignCases = isPrincipalPartner || isHeadOfChamber;
  const canVerifyPayments = isAccountOfficer || isAdminSecretary;

  const isAuthenticated = !!currentUser && !!session;
  const requiresPasswordChange = currentUser?.requiresPasswordChange ?? false;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        session,
        isAuthenticated,
        requiresPasswordChange,
        activeBranchId,
        isAllBranches,
        branches,
        users,
        login,
        logout,
        switchAccount,
        switchRole,
        changePassword,
        requestPasswordReset,
        completePasswordReset,
        setActiveBranchId,
        isPrincipalPartner,
        isHeadOfChamber,
        isAdminSecretary,
        isAccountOfficer,
        isCounselStaff,
        canManageFirm,
        canManageUsers,
        canManageWebsite,
        canAssignCases,
        canVerifyPayments
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
