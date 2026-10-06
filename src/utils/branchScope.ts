import { useAuth } from '../context/AuthContext';

/**
 * Checks whether an item belonging to `itemBranchId` is visible in the current branch context.
 * 
 * Rules:
 * 1. Principal Partner can view all branches or filter by a specific active branch.
 * 2. All other active users (Head of Chamber, Administrator/Secretary, Account Officer, Counsel/Staff)
 *    are STRICTLY isolated to their assigned branch (`currentUser.branchId`). They can only interact with
 *    and see activities within their branch.
 */
export const isItemInActiveBranch = (
  itemBranchId: string | undefined,
  activeBranchId: string,
  isPrincipalPartner: boolean,
  isAllBranches: boolean,
  userBranchId?: string
): boolean => {
  if (isPrincipalPartner) {
    if (isAllBranches || activeBranchId === 'ALL_BRANCHES') return true;
    if (!itemBranchId) return true;
    return itemBranchId === activeBranchId;
  }

  // Non-Principal Partner: STRICT branch isolation
  const targetBranch = userBranchId || activeBranchId;
  if (!itemBranchId) {
    // If legacy item has no branchId, default to Abuja head chamber
    return targetBranch === 'br-abuja-01';
  }
  return itemBranchId === targetBranch;
};

/**
 * React hook to filter lists and get the effective branch for creating new records
 */
export const useBranchScope = () => {
  const { currentUser, isPrincipalPartner, activeBranchId, isAllBranches, branches } = useAuth();

  const userBranchId = currentUser?.branchId || 'br-abuja-01';

  const filterByBranch = <T extends { branchId?: string }>(items: T[]): T[] => {
    return items.filter(item =>
      isItemInActiveBranch(item.branchId, activeBranchId, isPrincipalPartner, isAllBranches, userBranchId)
    );
  };

  /**
   * The branch ID to assign when the active user creates a new record.
   * If not Principal Partner, always returns their assigned branchId.
   */
  const getCreationBranchId = (): string => {
    if (!isPrincipalPartner) {
      return userBranchId;
    }
    if (isAllBranches || activeBranchId === 'ALL_BRANCHES') {
      return userBranchId || 'br-abuja-01';
    }
    return activeBranchId;
  };

  const currentBranchName = branches.find(b => b.id === (isPrincipalPartner ? (isAllBranches ? 'ALL_BRANCHES' : activeBranchId) : userBranchId))?.name || 'Assigned Branch';

  return {
    filterByBranch,
    getCreationBranchId,
    isPrincipalPartner,
    activeBranchId,
    isAllBranches,
    userBranchId,
    currentBranchName
  };
};
