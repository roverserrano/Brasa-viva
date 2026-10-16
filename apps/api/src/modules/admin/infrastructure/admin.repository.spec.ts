import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { Prisma } from '../../../../generated/prisma/client';
import type { PrismaService } from '../../../database/prisma.service';
import { AdminRepository } from './admin.repository';

function createRepository(transaction: unknown) {
  const prisma = {
    $transaction: vi.fn(
      async (operation: (transaction: Prisma.TransactionClient) => Promise<unknown>) =>
        operation(transaction as Prisma.TransactionClient)
    )
  };
  return { repository: new AdminRepository(prisma as unknown as PrismaService), prisma };
}

describe('administrative transaction invariants', () => {
  it('rejects a stale order transition inside the transaction', async () => {
    const transaction = {
      order: { findFirst: vi.fn().mockResolvedValue({ status: 'COMPLETED' }), updateMany: vi.fn() }
    };
    const { repository } = createRepository(transaction);
    await expect(
      repository.updateOrderStatus('actor', 'order', 'PREPARING')
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transaction.order.updateMany).not.toHaveBeenCalled();
  });

  it('does not overwrite a concurrent order change', async () => {
    const transaction = {
      order: {
        findFirst: vi.fn().mockResolvedValue({ status: 'RECEIVED' }),
        updateMany: vi.fn().mockResolvedValue({ count: 0 })
      },
      auditLog: { create: vi.fn() }
    };
    const { repository } = createRepository(transaction);
    await expect(
      repository.updateOrderStatus('actor', 'order', 'CONFIRMED')
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transaction.auditLog.create).not.toHaveBeenCalled();
  });

  it('revalidates a promotion after merging a partial date or discount update', async () => {
    const promotion = {
      id: 'id',
      name: 'Promo',
      slug: 'promo',
      description: null,
      promotionType: 'PERCENTAGE',
      promoPrice: null,
      discountAmount: null,
      discountPercent: '10.00',
      startsAt: new Date('2026-10-01'),
      endsAt: new Date('2026-10-10'),
      active: true,
      imageUrl: null,
      products: [{ productId: '00000000-0000-4000-8000-000000000001' }],
      branches: []
    };
    const transaction = {
      promotion: { findFirst: vi.fn().mockResolvedValue(promotion), update: vi.fn() }
    };
    const { repository } = createRepository(transaction);
    await expect(
      repository.updatePromotion('actor', 'id', { endsAt: '2026-09-01T00:00:00.000Z' })
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      repository.updatePromotion('actor', 'id', { discountPercent: '150.00' })
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transaction.promotion.update).not.toHaveBeenCalled();
  });

  it('protects the last active owner within a serializable transaction', async () => {
    const transaction = {
      user: {
        findFirst: vi
          .fn()
          .mockResolvedValue({ status: 'ACTIVE', roles: [{ role: { code: 'OWNER' } }] }),
        update: vi.fn()
      },
      userRole: { count: vi.fn().mockResolvedValue(1) }
    };
    const { repository, prisma } = createRepository(transaction);
    await expect(
      repository.updateUserAccess('actor', 'owner', { status: 'INACTIVE' })
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transaction.user.update).not.toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable'
    });
  });
});
