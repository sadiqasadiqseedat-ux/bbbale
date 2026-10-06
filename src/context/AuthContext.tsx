import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Branch, UserRole } from '../types';
import { storageService, subscribeToStore, initializeStorage, logAudit } from '../services/storage';

interface AuthContextType {
  currentUser: User | null;
  activeBranchId: string;
  isAllBranches: boolean;
  branches: Branch[];
  users: User[];
  login: (email: string) => boolean;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  setActiveBranchId: (branchId: string) => void;
  isPrincipalPartner: boolean;
  isHeadOfChamber: boolean;
  isAdminSecretary: boolean;
  isAccountOfficer: boolean;
  isCounselStaff: boolean;
  canManageFirm: boolean;
  canAssignCases: boolean;
  canVerifyPayments: boolean;
  canManagePublicContent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeBranchId, setActiveBranchIdState] = useState<string>('br-abuja-01');
  const [isAllBranches, setIsAllBranches] = useState<boolean>(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const loadData = () => {
    initializeStorage();
    const allUsers = storageService.getUsers();
    const allBranches = storageService.getBranches();
    setUsers(allUsers);
    setBranches(allBranches);

    const currentId = storageService.getCurrentUserId();
    const user = allUsers.find(u => u.id === currentId) || allUsers[0];
    setCurrentUser(user);

    const branchId = storageService.getActiveBranchId();
    setActiveBranchIdState(branchId);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToStore(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  const login = (email: string): boolean => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user && user.isActive) {
      storageService.setCurrentUserId(user.id);
      setCurrentUser(user);
      logAudit(user, 'USER_LOGIN', 'Session', user.id, `User logged in: ${user.name} (${user.role})`);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) {
      logAudit(currentUser, 'USER_LOGOUT', 'Session', currentUser.id, `User logged out: ${currentUser.name}`);
    }
    // Set to first available role or keep null
    storageService.setCurrentUserId('');
    setCurrentUser(null);
  };

  const switchRole = (targetRole: UserRole) => {
    const targetUser = users.find(u => u.role === targetRole && u.isActive);
    if (targetUser) {
      storageService.setCurrentUserId(targetUser.id);
      setCurrentUser(targetUser);
      // If moving away from principal partner, enforce that branch is specific
      if (targetRole !== 'PRINCIPAL_PARTNER' && isAllBranches) {
        setIsAllBranches(false);
        setActiveBranchIdState(targetUser.branchId || 'br-abuja-01');
        storageService.setActiveBranchId(targetUser.branchId || 'br-abuja-01');
      }
      logAudit(targetUser, 'ROLE_SWITCH', 'User', targetUser.id, `Switched active session to ${targetRole}: ${targetUser.name}`);
    }
  };

  const setActiveBranchId = (branchId: string) => {
    if (branchId === 'ALL_BRANCHES') {
      if (currentUser?.role === 'PRINCIPAL_PARTNER') {
        setIsAllBranches(true);
        setActiveBranchIdState('ALL_BRANCHES');
      }
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

  // Specific high-level permission sets
  const canManageFirm = isPrincipalPartner;
  const canAssignCases = isPrincipalPartner || isHeadOfChamber;
  const canVerifyPayments = isAccountOfficer || isAdminSecretary;
  const canManagePublicContent = isPrincipalPartner || isHeadOfChamber;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeBranchId,
        isAllBranches,
        branches,
        users,
        login,
        logout,
        switchRole,
        setActiveBranchId,
        isPrincipalPartner,
        isHeadOfChamber,
        isAdminSecretary,
        isAccountOfficer,
        isCounselStaff,
        canManageFirm,
        canAssignCases,
        canVerifyPayments,
        canManagePublicContent
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
