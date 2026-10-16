import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { AdminPrincipal } from '../../auth/domain/admin-policy';
import { AdminRepository } from '../infrastructure/admin.repository';
import { AdminService } from './admin.service';

const principal: AdminPrincipal = {
  userId: '00000000-0000-4000-8000-000000000001',
  authUserId: '00000000-0000-4000-8000-000000000002',
  email: 'owner@brasaviva.bo',
  fullName: 'Owner',
  roles: ['OWNER'],
  branchIds: []
};

describe('AdminService order workflow', () => {
  it('does not persist an invalid terminal status transition', async () => {
    const repository = {
      findOrder: vi.fn().mockResolvedValue({
        id: '00000000-0000-4000-8000-000000000003',
        branchId: '00000000-0000-4000-8000-000000000004',
        status: 'COMPLETED'
      }),
      updateOrderStatus: vi.fn()
    };
    const service = new AdminService(repository as unknown as AdminRepository);

    await expect(
      service.updateOrderStatus(principal, '00000000-0000-4000-8000-000000000003', { status: 'CANCELLED' })
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.updateOrderStatus).not.toHaveBeenCalled();
  });
});
