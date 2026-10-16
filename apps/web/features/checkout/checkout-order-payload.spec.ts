import { describe, expect, it } from 'vitest';
import { buildCreateOrderRequest } from './checkout-order-payload';

describe('buildCreateOrderRequest', () => {
  it('sends only product identifiers and quantities, never client prices', () => {
    expect(
      buildCreateOrderRequest({
        branchSlug: 'brasa-viva-centro',
        orderType: 'PICKUP',
        fields: {
          customerName: ' María Pérez ',
          customerPhone: ' 70707070 ',
          deliveryAddress: '',
          notes: ' Sin cebolla '
        },
        items: [
          {
            productId: '00000000-0000-4000-8000-000000000001',
            name: 'Broaster clásico',
            unitPrice: '0.01',
            quantity: 2
          }
        ]
      })
    ).toEqual({
      branchSlug: 'brasa-viva-centro',
      orderType: 'PICKUP',
      customer: {
        name: 'María Pérez',
        phone: '70707070',
        notes: 'Sin cebolla'
      },
      items: [
        {
          productId: '00000000-0000-4000-8000-000000000001',
          quantity: 2
        }
      ]
    });
  });

  it('includes the address only for delivery', () => {
    expect(
      buildCreateOrderRequest({
        branchSlug: 'brasa-viva-centro',
        orderType: 'DELIVERY',
        fields: {
          customerName: 'María Pérez',
          customerPhone: '70707070',
          deliveryAddress: 'Av. América 123, Cochabamba',
          notes: ''
        },
        items: [
          {
            productId: '00000000-0000-4000-8000-000000000001',
            name: 'Broaster clásico',
            unitPrice: '32.00',
            quantity: 1
          }
        ]
      }).customer
    ).toMatchObject({ deliveryAddress: 'Av. América 123, Cochabamba' });
  });
});
