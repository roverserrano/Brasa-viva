import { describe, expect, it } from 'vitest';
import { calculateOrder, centsToMoney, moneyToCents } from './order-pricing';

describe('order pricing', () => {
  it('uses cents without floating point errors and chooses the best eligible promotion', () => {
    const calculated = calculateOrder(
      [
        {
          productId: 'product-1',
          name: 'Pollo al spiedo',
          unitPrice: '40.00',
          quantity: 2
        }
      ],
      [
        {
          id: 'percentage-promotion',
          promotionType: 'PERCENTAGE',
          promoPrice: null,
          discountPercent: '10.00',
          discountAmount: null,
          products: [{ productId: 'product-1', quantity: 1 }]
        },
        {
          id: 'fixed-price-promotion',
          promotionType: 'FIXED_PRICE',
          promoPrice: '32.00',
          discountPercent: null,
          discountAmount: null,
          products: [{ productId: 'product-1', quantity: 1 }]
        }
      ]
    );

    expect(calculated).toEqual({
      lines: [
        {
          productId: 'product-1',
          productName: 'Pollo al spiedo',
          quantity: 2,
          unitPrice: '40.00',
          discountAmount: '16.00',
          lineTotal: '64.00',
          appliedPromotionId: 'fixed-price-promotion'
        }
      ],
      subtotal: '80.00',
      discountTotal: '16.00',
      total: '64.00'
    });
  });

  it('does not apply bundle promotions and never creates a negative price', () => {
    const calculated = calculateOrder(
      [
        {
          productId: 'product-1',
          name: 'Broaster clásico',
          unitPrice: '10.00',
          quantity: 1
        }
      ],
      [
        {
          id: 'bundle-promotion',
          promotionType: 'BUNDLE',
          promoPrice: '1.00',
          discountPercent: null,
          discountAmount: null,
          products: [{ productId: 'product-1', quantity: 1 }]
        },
        {
          id: 'high-discount',
          promotionType: 'FIXED_DISCOUNT',
          promoPrice: null,
          discountPercent: null,
          discountAmount: '50.00',
          products: [{ productId: 'product-1', quantity: 1 }]
        }
      ]
    );

    expect(calculated.lines[0]).toMatchObject({
      lineTotal: '0.00',
      discountAmount: '10.00',
      appliedPromotionId: 'high-discount'
    });
  });

  it('converts money deterministically', () => {
    expect(centsToMoney(moneyToCents('19.99'))).toBe('19.99');
  });
});
