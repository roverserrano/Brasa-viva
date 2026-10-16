import { describe, expect, it } from 'vitest';
import { adminPromotionResponseSchema, createAdminPromotionRequestSchema } from './admin';
import { moneySchema } from './catalog';
import {
  createAdminBranchRequestSchema,
  updateAdminProductRequestSchema,
  updateAdminPromotionRequestSchema
} from './admin';

const basePromotion = {
  name: 'Promo de prueba',
  slug: 'promo-de-prueba',
  description: null,
  startsAt: '2026-10-06T12:00:00.000Z',
  endsAt: '2026-10-07T12:00:00.000Z',
  active: true,
  imageUrl: null,
  productIds: ['00000000-0000-4000-8000-000000000001'],
  branchIds: []
};

describe('administrative promotion contracts', () => {
  it('accepts familiar money formats and normalizes decimal database responses', () => {
    expect(moneySchema.parse('32,5')).toBe('32.50');
    expect(moneySchema.parse('32.5')).toBe('32.50');
    expect(moneySchema.parse('32')).toBe('32.00');
    expect(moneySchema.safeParse('-32').success).toBe(false);
  });
  it('rejects executable links, invalid business hours and excessive partial percentages', () => {
    expect(
      updateAdminProductRequestSchema.safeParse({ imageUrl: 'javascript:alert(1)' }).success
    ).toBe(false);
    expect(updateAdminPromotionRequestSchema.safeParse({ discountPercent: '150.00' }).success).toBe(
      false
    );
    expect(
      createAdminBranchRequestSchema.safeParse({
        code: 'CENTRO',
        name: 'Centro',
        slug: 'centro',
        addressLine: 'Av. Central',
        businessHours: [{ weekday: 1, opensAt: '29:99', closesAt: null, isClosed: false }]
      }).success
    ).toBe(false);
  });
  it('rejects a percentage that could increase an item price', () => {
    expect(
      createAdminPromotionRequestSchema.safeParse({
        ...basePromotion,
        promotionType: 'PERCENTAGE',
        discountPercent: '101.00'
      }).success
    ).toBe(false);
  });

  it('does not expose bundles before their composition is implemented', () => {
    expect(
      createAdminPromotionRequestSchema.safeParse({
        ...basePromotion,
        promotionType: 'BUNDLE'
      }).success
    ).toBe(false);
  });

  it('shows a legacy incomplete promotion for repair while rejecting it on creation', () => {
    const incompletePromotion = {
      ...basePromotion,
      productIds: []
    };

    expect(
      adminPromotionResponseSchema.safeParse({
        ...incompletePromotion,
        id: '00000000-0000-4000-8000-000000000002',
        promotionType: 'FIXED_PRICE',
        promoPrice: '20.00',
        discountPercent: null,
        discountAmount: null,
        updatedAt: '2026-10-06T12:00:00.000Z'
      }).success
    ).toBe(true);
    expect(
      createAdminPromotionRequestSchema.safeParse({
        ...incompletePromotion,
        promotionType: 'FIXED_PRICE',
        promoPrice: '20.00',
        discountPercent: null,
        discountAmount: null
      }).success
    ).toBe(false);
  });
});
