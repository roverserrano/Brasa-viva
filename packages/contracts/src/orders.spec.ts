import { describe, expect, it } from 'vitest';
import { createOrderRequestSchema, orderTypeLabels, orderTypeSchema } from './orders';

const validRequest = {
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

describe('createOrderRequestSchema', () => {
  it('removes price fields supplied by a client', () => {
    const request = createOrderRequestSchema.parse({
      ...validRequest,
      total: '0.01',
      items: [{ ...validRequest.items[0], unitPrice: '0.01', subtotal: '0.01' }]
    });

    expect(request).toEqual(validRequest);
  });

  it('requires an address for delivery', () => {
    expect(() =>
      createOrderRequestSchema.parse({
        ...validRequest,
        orderType: 'DELIVERY'
      })
    ).toThrow();
  });
});

describe('orderTypeLabels', () => {
  it('covers every supported order type', () => {
    expect(Object.keys(orderTypeLabels).sort()).toEqual([...orderTypeSchema.options].sort());
  });
});
