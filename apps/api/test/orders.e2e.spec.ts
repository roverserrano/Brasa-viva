import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { CreateOrderResponse } from '@brasa-viva/contracts';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { OrdersService } from '../src/modules/orders/application/orders.service';
import { OrdersController } from '../src/modules/orders/orders.controller';

const confirmedOrder: CreateOrderResponse = {
  orderCode: 'BV-000001',
  status: 'RECEIVED',
  branch: {
    id: '00000000-0000-4000-8000-000000000010',
    name: 'Brasa Viva Centro'
  },
  orderType: 'PICKUP',
  items: [
    {
      productId: '00000000-0000-4000-8000-000000000001',
      productName: 'Broaster clásico',
      quantity: 2,
      unitPrice: '32.00',
      discountAmount: '0.00',
      lineTotal: '64.00',
      appliedPromotionId: null
    }
  ],
  subtotal: '64.00',
  discountTotal: '0.00',
  deliveryFee: '0.00',
  total: '64.00',
  whatsappUrl: 'https://wa.me/59170000001?text=Pedido'
};

describe('POST /api/v1/orders', () => {
  let app: INestApplication;
  const createOrder = vi.fn();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: { create: createOrder }
        }
      ]
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('strips manipulated amounts before calling the application service', async () => {
    createOrder.mockResolvedValueOnce(confirmedOrder);

    await request(app.getHttpServer())
      .post('/api/v1/orders')
      .send({
        branchSlug: 'brasa-viva-centro',
        orderType: 'PICKUP',
        customer: {
          name: 'María Pérez',
          phone: '70707070'
        },
        items: [
          {
            productId: '00000000-0000-4000-8000-000000000001',
            quantity: 2,
            unitPrice: '0.01'
          }
        ],
        total: '0.01'
      })
      .expect(201)
      .expect(confirmedOrder);

    expect(createOrder).toHaveBeenCalledWith({
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
    });
  });

  it('rejects delivery without an address before the service is called', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/orders')
      .send({
        branchSlug: 'brasa-viva-centro',
        orderType: 'DELIVERY',
        customer: {
          name: 'María Pérez',
          phone: '70707070'
        },
        items: [
          {
            productId: '00000000-0000-4000-8000-000000000001',
            quantity: 1
          }
        ]
      })
      .expect(400)
      .expect((response) => {
        expect(response.body).toMatchObject({
          code: 'INVALID_ORDER_REQUEST'
        });
      });

    expect(createOrder).toHaveBeenCalledTimes(1);
  });
});
