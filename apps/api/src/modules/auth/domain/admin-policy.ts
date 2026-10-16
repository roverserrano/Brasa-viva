export const adminRoleCodes = ['OWNER', 'ADMIN', 'BRANCH_MANAGER', 'EDITOR', 'OPERATOR'] as const;

export type AdminRoleCode = (typeof adminRoleCodes)[number];

export const adminCapabilities = {
  viewDashboard: 'VIEW_DASHBOARD',
  viewCatalog: 'VIEW_CATALOG',
  manageCatalog: 'MANAGE_CATALOG',
  manageBranches: 'MANAGE_BRANCHES',
  manageBranchOperations: 'MANAGE_BRANCH_OPERATIONS',
  managePromotions: 'MANAGE_PROMOTIONS',
  viewOrders: 'VIEW_ORDERS',
  updateOrderStatus: 'UPDATE_ORDER_STATUS',
  manageUsers: 'MANAGE_USERS',
  manageSettings: 'MANAGE_SETTINGS'
} as const;

export type AdminCapability = (typeof adminCapabilities)[keyof typeof adminCapabilities];

const capabilityRoles: Record<AdminCapability, readonly AdminRoleCode[]> = {
  VIEW_DASHBOARD: ['OWNER', 'ADMIN', 'BRANCH_MANAGER', 'OPERATOR'],
  VIEW_CATALOG: ['OWNER', 'ADMIN', 'BRANCH_MANAGER', 'EDITOR'],
  MANAGE_CATALOG: ['OWNER', 'ADMIN', 'EDITOR'],
  MANAGE_BRANCHES: ['OWNER', 'ADMIN'],
  MANAGE_BRANCH_OPERATIONS: ['OWNER', 'ADMIN', 'BRANCH_MANAGER'],
  MANAGE_PROMOTIONS: ['OWNER', 'ADMIN', 'EDITOR'],
  VIEW_ORDERS: ['OWNER', 'ADMIN', 'BRANCH_MANAGER', 'OPERATOR'],
  UPDATE_ORDER_STATUS: ['OWNER', 'ADMIN', 'BRANCH_MANAGER', 'OPERATOR'],
  MANAGE_USERS: ['OWNER'],
  MANAGE_SETTINGS: ['OWNER', 'ADMIN']
};

export type AdminPrincipal = {
  userId: string;
  authUserId: string;
  email: string;
  fullName: string;
  roles: AdminRoleCode[];
  branchIds: string[];
};

export function hasCapability(principal: AdminPrincipal, capability: AdminCapability): boolean {
  return principal.roles.some((role) => capabilityRoles[capability].includes(role));
}

export function canAccessBranch(
  principal: AdminPrincipal,
  branchId: string,
  capability: AdminCapability
): boolean {
  if (!hasCapability(principal, capability)) {
    return false;
  }

  if (principal.roles.includes('OWNER') || principal.roles.includes('ADMIN')) {
    return true;
  }

  return principal.branchIds.includes(branchId);
}
