import { describe, expect, it } from 'vitest';
import { effectivePrice, resolveEffectivePrice } from './resolve-effective-price';

describe('effectivePrice', () => {
  it('prefers the branch override', () => {
    expect(effectivePrice('32.00', '35.00').toString()).toBe('35.00');
  });

  it('falls back to the base price when there is no override', () => {
    expect(effectivePrice('32.00', null).toString()).toBe('32.00');
  });
});

describe('resolveEffectivePrice', () => {
  it('uses the base price for an active product available in the branch', () => {
    expect(
      resolveEffectivePrice({
        basePrice: '32.00',
        priceOverride: null,
        productActive: true,
        branchAvailable: true
      })
    ).toEqual({ available: true, price: '32.00' });
  });

  it('uses the branch override when it exists', () => {
    expect(
      resolveEffectivePrice({
        basePrice: '32.00',
        priceOverride: '35.00',
        productActive: true,
        branchAvailable: true
      })
    ).toEqual({ available: true, price: '35.00' });
  });

  it('does not expose a price for an unavailable product', () => {
    expect(
      resolveEffectivePrice({
        basePrice: '32.00',
        priceOverride: '35.00',
        productActive: true,
        branchAvailable: false
      })
    ).toEqual({ available: false, price: null });
  });
});
