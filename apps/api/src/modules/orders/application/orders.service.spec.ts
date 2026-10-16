import { ConflictException } from '@nestjs/common';
import type { CreateOrderRequest } from '@brasa-viva/contracts';
import { describe, expect, it, vi } from 'vitest';
import { OrdersService } from './orders.service';
import { OrdersRepository } from '../infrastructure/orders.repository';

const request: CreateOrderRequest = {
  branchSlug: 'brasa-viva-centro',
  orderType: 'PICKUP',
  customer: {
    name: 'María Pérez',
    phone: '70707070'
  },
  items: [
    {
      productId: '00000000-0000-4000-8000-000000000001',
      quantity: 2
    }
  ]
};

function createRepository() {
  const transaction = {};
  const repository = {
    withTransaction: vi.fn(async (operation) => operation(transaction)),
    findActiveBranch: vi.fn().mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000010',
      name: 'Brasa Viva Centro',
      whatsapp: '59170000001',
      services: [{ serviceType: 'PICKUP' }]
    }),
    findPurchasableProducts: vi.fn().mockResolvedValue([
      {
        productId: request.items[0]?.productId,
        priceOverride: '40.00',
        product: {
          name: 'Pollo al spiedo',
          basePrice: '38.00'
        }
      }
    ]),
    findEligiblePromotions: vi.fn().mockResolvedValue([]),
    findOrCreateCustomer: vi.fn().mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000020'
    }),
    createOrder: vi.fn().mockResolvedValue({
      orderCode: 'BV-000001',
      status: 'RECEIVED'
    })
  };

  return repository;
}

describe('OrdersService', () => {
  it('persists server-calculated snapshots and returns WhatsApp only after persistence', async () => {
    const repository = createRepository();
    const service = new OrdersService(repository as unknown as OrdersRepository);

    await expect(service.create(request)).resolves.toMatchObject({
      orderCode: 'BV-000001',
      subtotal: '80.00',
      total: '80.00',
      whatsappUrl: expect.stringContaining('https://wa.me/59170000001')
    });
    expect(repository.createOrder).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        subtotal: '80.00',
        total: '80.00',
        items: [
          expect.objectContaining({
            unitPrice: '40.00',
            lineTotal: '80.00'
          })
        ]
      })
    );
  });

  it('rejects unavailable products before creating a customer or order', async () => {
    const repository = createRepository();
    repository.findPurchasableProducts.mockResolvedValue([]);
    const service = new OrdersService(repository as unknown as OrdersRepository);

    await expect(service.create(request)).rejects.toBeInstanceOf(ConflictException);
    expect(repository.findOrCreateCustomer).not.toHaveBeenCalled();
    expect(repository.createOrder).not.toHaveBeenCalled();
  });
});
