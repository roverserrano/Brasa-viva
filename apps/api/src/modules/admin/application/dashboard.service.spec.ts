import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { AdminPrincipal } from '../../auth/domain/admin-policy';
import { DashboardService } from './dashboard.service';
import { DashboardRepository } from '../infrastructure/dashboard.repository';
const branch = { id: '00000000-0000-4000-8000-000000000001', name: 'Centro' };
const other = '00000000-0000-4000-8000-000000000002';
const principal: AdminPrincipal = {
  userId: 'u',
  authUserId: 'a',
  email: 'test@example.test',
  fullName: 'Test',
  roles: ['OPERATOR'],
  branchIds: [branch.id]
};
function setup(branches = [branch]) {
  const repository = {
    listBranches: vi.fn().mockResolvedValue(branches),
    aggregate: vi.fn().mockResolvedValue([])
  };
  return {
    repository,
    service: new DashboardService(repository as unknown as DashboardRepository)
  };
}
describe('executive dashboard branch authorization', () => {
  it('rejects a forged branch before querying', async () => {
    const { service, repository } = setup();
    await expect(
      service.getInsights(principal, { days: 7, branchId: other })
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.listBranches).not.toHaveBeenCalled();
    expect(repository.aggregate).not.toHaveBeenCalled();
  });
  it('scopes options and aggregation to the assigned branches', async () => {
    const { service, repository } = setup();
    const result = await service.getInsights(principal, { days: 30 });
    expect(repository.listBranches).toHaveBeenCalledWith([branch.id]);
    expect(repository.aggregate).toHaveBeenCalledWith(
      [branch.id],
      expect.any(Date),
      expect.any(Date)
    );
    expect(result.branches).toEqual([branch]);
  });
  it('keeps users without branches in an empty scope', async () => {
    const { service, repository } = setup([]);
    const result = await service.getInsights({ ...principal, branchIds: [] }, { days: 7 });
    expect(repository.listBranches).toHaveBeenCalledWith([]);
    expect(repository.aggregate).toHaveBeenCalledWith([], expect.any(Date), expect.any(Date));
    expect(result.current.orders).toBe(0);
    expect(result.branches).toEqual([]);
  });
  it('allows global admins to select a branch without leaking other branch totals', async () => {
    const { service, repository } = setup([branch, { id: other, name: 'Norte' }]);
    const result = await service.getInsights(
      { ...principal, roles: ['ADMIN'] },
      { days: 90, branchId: other }
    );
    expect(repository.listBranches).toHaveBeenCalledWith(undefined);
    expect(repository.aggregate).toHaveBeenCalledWith([other], expect.any(Date), expect.any(Date));
    expect(result.byBranch.map((b) => b.id)).toEqual([other]);
  });
});
