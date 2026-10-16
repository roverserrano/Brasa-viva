import { z } from 'zod';

export const moneySchema = z
  .string()
  .trim()
  .transform((value) => value.replace(',', '.'))
  .pipe(z.string().regex(/^\d{1,10}(\.\d{1,2})?$/, 'Ingresa un importe válido, por ejemplo 32,50.'))
  .transform((value) => {
    const [whole, fraction = ''] = value.split('.');
    return `${whole}.${fraction.padEnd(2, '0')}`;
  });

export const branchResponseSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  address: z.string().min(1),
  whatsapp: z.string().nullable(),
  active: z.boolean()
});

export const branchServiceTypeSchema = z.enum(['PICKUP', 'DELIVERY', 'DINE_IN', 'QR_PAYMENT']);

export const branchBusinessHourSchema = z.object({
  weekday: z.int().min(0).max(6),
  opensAt: z.string().nullable(),
  closesAt: z.string().nullable(),
  isClosed: z.boolean()
});

export const branchDetailResponseSchema = branchResponseSchema.extend({
  phone: z.string().nullable(),
  city: z.string(),
  services: z.array(branchServiceTypeSchema),
  businessHours: z.array(branchBusinessHourSchema)
});

export const categoryResponseSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable()
});

export const categoryListResponseSchema = z.array(categoryResponseSchema);

export const productResponseSchema = z.object({
  id: z.uuid(),
  categoryId: z.uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable(),
  price: moneySchema,
  available: z.boolean(),
  featured: z.boolean(),
  imageUrl: z.url().nullable()
});

export const catalogResponseSchema = z.object({
  branch: branchResponseSchema,
  products: z.array(productResponseSchema)
});

export const productDetailResponseSchema = productResponseSchema.extend({
  branch: branchResponseSchema,
  category: categoryResponseSchema
});

export const branchListResponseSchema = z.array(branchResponseSchema);

export const promotionResponseSchema = z.object({
  id: z.uuid(),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  type: z.enum(['FIXED_PRICE', 'PERCENTAGE', 'FIXED_DISCOUNT', 'BUNDLE']),
  promoPrice: moneySchema.nullable(),
  discountPercent: moneySchema.nullable(),
  discountAmount: moneySchema.nullable(),
  endsAt: z.iso.datetime()
});

export const promotionListResponseSchema = z.array(promotionResponseSchema);

export type BranchResponse = z.infer<typeof branchResponseSchema>;
export type BranchDetailResponse = z.infer<typeof branchDetailResponseSchema>;
export type CategoryResponse = z.infer<typeof categoryResponseSchema>;
export type CategoryListResponse = z.infer<typeof categoryListResponseSchema>;
export type ProductResponse = z.infer<typeof productResponseSchema>;
export type ProductDetailResponse = z.infer<typeof productDetailResponseSchema>;
export type CatalogResponse = z.infer<typeof catalogResponseSchema>;
export type BranchListResponse = z.infer<typeof branchListResponseSchema>;
export type PromotionResponse = z.infer<typeof promotionResponseSchema>;
export type PromotionListResponse = z.infer<typeof promotionListResponseSchema>;
