import { describe, expect, it } from 'vitest';
import { adminCapabilities, canAccessBranch, hasCapability, type AdminPrincipal } from './admin-policy';

const manager: AdminPrincipal = {
  userId: '00000000-0000-4000-8000-000000000001',
  authUserId: '00000000-0000-4000-8000-000000000002',
  email: 'gerente@brasaviva.bo',
  fullName: 'Gerente',
  roles: ['BRANCH_MANAGER'],
  branchIds: ['00000000-0000-4000-8000-000000000010']
};

describe('administrative policy', () => {
  it('limits branch managers to their assigned branches', () => {
    expect(canAccessBranch(manager, manager.branchIds[0] ?? '', adminCapabilities.manageBranchOperations)).toBe(true);
    expect(
      canAccessBranch(manager, '00000000-0000-4000-8000-000000000011', adminCapabilities.manageBranchOperations)
    ).toBe(false);
  });

  it('does not grant order or user management to editors', () => {
    const editor: AdminPrincipal = { ...manager, roles: ['EDITOR'], branchIds: [] };

    expect(hasCapability(editor, adminCapabilities.manageCatalog)).toBe(true);
    expect(hasCapability(editor, adminCapabilities.viewOrders)).toBe(false);
    expect(hasCapability(editor, adminCapabilities.manageUsers)).toBe(false);
  });
});
