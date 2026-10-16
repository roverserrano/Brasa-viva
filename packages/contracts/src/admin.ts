import { z } from 'zod';
import { branchBusinessHourSchema, branchServiceTypeSchema, moneySchema } from './catalog';
import { orderStatusSchema, orderTypeSchema } from './orders';

const adminRoleSchema = z.enum(['OWNER', 'ADMIN', 'BRANCH_MANAGER', 'EDITOR', 'OPERATOR']);
const userStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']);
const branchStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'TEMPORARILY_CLOSED']);
const stockStatusSchema = z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'NOT_TRACKED']);
const promotionTypeSchema = z.enum(['FIXED_PRICE', 'PERCENTAGE', 'FIXED_DISCOUNT', 'BUNDLE']);
const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(180)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug solo puede usar minúsculas, números y guiones.');
const nullableText = (maxLength: number) => z.string().trim().max(maxLength).nullable().optional();
const httpUrlSchema = z
  .url()
  .refine(
    (value) => /^https?:\/\//.test(value),
    'Usa un enlace que empiece con https:// o http://.'
  );

export const adminPaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25)
});

export const adminPaginationMetaSchema = z.object({
  page: z.int().min(1),
  pageSize: z.int().min(1).max(100),
  total: z.int().min(0)
});

export const adminMeResponseSchema = z.object({
  id: z.uuid(),
  email: z.string().email(),
  fullName: z.string().min(1),
  roles: z.array(adminRoleSchema).min(1),
  branchIds: z.array(z.uuid())
});

export const adminCategoryResponseSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  slug: slugSchema,
  description: z.string().nullable(),
  displayOrder: z.int(),
  active: z.boolean(),
  updatedAt: z.iso.datetime()
});

const categoryFieldsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: slugSchema.max(140),
  description: nullableText(2_000),
  displayOrder: z.int().min(0).max(10_000).default(0),
  active: z.boolean().default(true)
});

export const createAdminCategoryRequestSchema = categoryFieldsSchema;
export const updateAdminCategoryRequestSchema = categoryFieldsSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Incluye al menos un cambio.');

export const adminCategoryListResponseSchema = z.object({
  items: z.array(adminCategoryResponseSchema),
  pagination: adminPaginationMetaSchema
});

export const adminBranchProductResponseSchema = z.object({
  branchId: z.uuid(),
  branchName: z.string().min(1),
  available: z.boolean(),
  priceOverride: moneySchema.nullable(),
  stockStatus: stockStatusSchema
});

export const branchProductAssignmentRequestSchema = z.object({
  branchId: z.uuid(),
  available: z.boolean().default(true),
  priceOverride: moneySchema.nullable().default(null),
  stockStatus: stockStatusSchema.default('NOT_TRACKED')
});

export const updateBranchProductRequestSchema = branchProductAssignmentRequestSchema
  .omit({ branchId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Incluye al menos un cambio.');

export const adminProductResponseSchema = z.object({
  id: z.uuid(),
  categoryId: z.uuid(),
  categoryName: z.string().min(1),
  name: z.string().min(1),
  slug: slugSchema,
  description: z.string().nullable(),
  basePrice: moneySchema,
  active: z.boolean(),
  featured: z.boolean(),
  isNew: z.boolean(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  imageUrl: z.url().nullable(),
  branchAssignments: z.array(adminBranchProductResponseSchema),
  updatedAt: z.iso.datetime()
});

const productFieldsSchema = z.object({
  categoryId: z.uuid(),
  name: z.string().trim().min(1).max(160),
  slug: slugSchema,
  description: nullableText(4_000),
  basePrice: moneySchema,
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  seoTitle: nullableText(180),
  seoDescription: nullableText(320),
  imageUrl: httpUrlSchema.nullable().optional(),
  branchAssignments: z.array(branchProductAssignmentRequestSchema).max(100).default([])
});

export const createAdminProductRequestSchema = productFieldsSchema.superRefine((value, context) => {
  const branchIds = new Set<string>();
  value.branchAssignments.forEach((assignment, index) => {
    if (branchIds.has(assignment.branchId)) {
      context.addIssue({
        code: 'custom',
        path: ['branchAssignments', index, 'branchId'],
        message: 'Cada sucursal solo puede aparecer una vez.'
      });
    }
    branchIds.add(assignment.branchId);
  });
});

export const updateAdminProductRequestSchema = productFieldsSchema
  .omit({ branchAssignments: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Incluye al menos un cambio.');

export const adminProductListResponseSchema = z.object({
  items: z.array(adminProductResponseSchema),
  pagination: adminPaginationMetaSchema
});

export const adminBranchResponseSchema = z.object({
  id: z.uuid(),
  code: z.string().min(1),
  name: z.string().min(1),
  slug: slugSchema,
  description: z.string().nullable(),
  addressLine: z.string().min(1),
  city: z.string().min(1),
  department: z.string().min(1),
  countryCode: z.string().length(2),
  latitude: z.string().nullable(),
  longitude: z.string().nullable(),
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  googleMapsUrl: z.url().nullable(),
  imageUrl: z.url().nullable(),
  status: branchStatusSchema,
  timezone: z.string().min(1),
  services: z.array(branchServiceTypeSchema),
  businessHours: z.array(branchBusinessHourSchema),
  updatedAt: z.iso.datetime()
});

const adminBusinessHourInputSchema = z.object({
  weekday: z.int().min(0).max(6),
  opensAt: z
    .string()
    .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
    .nullable(),
  closesAt: z
    .string()
    .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
    .nullable(),
  isClosed: z.boolean().default(false)
});

const branchFieldsSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[A-Z0-9-]+$/),
  name: z.string().trim().min(1).max(140),
  slug: slugSchema.max(160),
  description: nullableText(4_000),
  addressLine: z.string().trim().min(1).max(250),
  city: z.string().trim().min(1).max(100).default('Cochabamba'),
  department: z.string().trim().min(1).max(100).default('Cochabamba'),
  countryCode: z.string().trim().toUpperCase().length(2).default('BO'),
  latitude: z
    .string()
    .regex(/^-?\d+(\.\d{1,6})?$/)
    .nullable()
    .optional(),
  longitude: z
    .string()
    .regex(/^-?\d+(\.\d{1,6})?$/)
    .nullable()
    .optional(),
  phone: nullableText(40),
  whatsapp: nullableText(40),
  googleMapsUrl: httpUrlSchema.nullable().optional(),
  imageUrl: httpUrlSchema.nullable().optional(),
  status: branchStatusSchema.default('ACTIVE'),
  timezone: z.string().trim().min(1).max(80).default('America/La_Paz'),
  services: z.array(branchServiceTypeSchema).default([]),
  businessHours: z.array(adminBusinessHourInputSchema).max(7).default([])
});

export const createAdminBranchRequestSchema = branchFieldsSchema.superRefine((value, context) => {
  assertUniqueWeekdays(value.businessHours, context);
});
export const updateAdminBranchRequestSchema = branchFieldsSchema
  .partial()
  .superRefine((value, context) => {
    if (Object.keys(value).length === 0) {
      context.addIssue({ code: 'custom', message: 'Incluye al menos un cambio.' });
    }
    if (value.businessHours) {
      assertUniqueWeekdays(value.businessHours, context);
    }
  });

export const adminBranchListResponseSchema = z.object({
  items: z.array(adminBranchResponseSchema),
  pagination: adminPaginationMetaSchema
});

export const adminPromotionResponseSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  slug: slugSchema,
  description: z.string().nullable(),
  promotionType: promotionTypeSchema,
  promoPrice: moneySchema.nullable(),
  discountPercent: moneySchema.nullable(),
  discountAmount: moneySchema.nullable(),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
  active: z.boolean(),
  imageUrl: z.url().nullable(),
  // The administrative read model must expose legacy incomplete records so an
  // editor can repair them. Creation and updates keep the publication rule in
  // promotionFieldsSchema below: at least one product is required.
  productIds: z.array(z.uuid()),
  branchIds: z.array(z.uuid()),
  updatedAt: z.iso.datetime()
});

const promotionFieldsSchema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: slugSchema,
  description: nullableText(4_000),
  promotionType: promotionTypeSchema,
  promoPrice: moneySchema.nullable().optional(),
  discountPercent: moneySchema.nullable().optional(),
  discountAmount: moneySchema.nullable().optional(),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
  active: z.boolean().default(true),
  imageUrl: httpUrlSchema.nullable().optional(),
  productIds: z.array(z.uuid()).min(1).max(100),
  branchIds: z.array(z.uuid()).max(100).default([])
});

export const createAdminPromotionRequestSchema =
  promotionFieldsSchema.superRefine(validatePromotion);
export const updateAdminPromotionRequestSchema = promotionFieldsSchema
  .partial()
  .superRefine((value, context) => {
    if (Object.keys(value).length === 0) {
      context.addIssue({ code: 'custom', message: 'Incluye al menos un cambio.' });
    }
    if (value.startsAt && value.endsAt && new Date(value.startsAt) >= new Date(value.endsAt)) {
      context.addIssue({
        code: 'custom',
        path: ['endsAt'],
        message: 'El fin debe ser posterior al inicio.'
      });
    }
    if (value.promotionType === 'FIXED_PRICE' && !value.promoPrice) {
      context.addIssue({
        code: 'custom',
        path: ['promoPrice'],
        message: 'Ingresa el precio promocional.'
      });
    }
    if (value.promotionType === 'PERCENTAGE' && !value.discountPercent) {
      context.addIssue({
        code: 'custom',
        path: ['discountPercent'],
        message: 'Ingresa el porcentaje de descuento.'
      });
    }
    if (value.promotionType === 'FIXED_DISCOUNT' && !value.discountAmount) {
      context.addIssue({
        code: 'custom',
        path: ['discountAmount'],
        message: 'Ingresa el descuento fijo.'
      });
    }
    if (
      value.discountPercent &&
      (Number(value.discountPercent) <= 0 || Number(value.discountPercent) > 100)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['discountPercent'],
        message: 'El porcentaje debe ser mayor a 0 y no superar 100.'
      });
    }
    if (value.promotionType === 'BUNDLE') {
      context.addIssue({
        code: 'custom',
        path: ['promotionType'],
        message: 'Las promociones bundle no están disponibles hasta implementar su composición.'
      });
    }
  });

export const adminPromotionListResponseSchema = z.object({
  items: z.array(adminPromotionResponseSchema),
  pagination: adminPaginationMetaSchema
});

export const adminOrderItemResponseSchema = z.object({
  id: z.uuid(),
  productName: z.string().min(1),
  quantity: z.int().min(1),
  unitPrice: moneySchema,
  discountAmount: moneySchema,
  lineTotal: moneySchema
});

export const adminOrderResponseSchema = z.object({
  id: z.uuid(),
  orderCode: z.string().nullable(),
  branchId: z.uuid(),
  branchName: z.string().min(1),
  status: orderStatusSchema,
  orderType: orderTypeSchema,
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  deliveryAddress: z.string().nullable(),
  notes: z.string().nullable(),
  subtotal: moneySchema,
  discountTotal: moneySchema,
  deliveryFee: moneySchema,
  total: moneySchema,
  items: z.array(adminOrderItemResponseSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime()
});

export const adminOrderListResponseSchema = z.object({
  items: z.array(adminOrderResponseSchema),
  pagination: adminPaginationMetaSchema
});

export const updateAdminOrderStatusRequestSchema = z.object({ status: orderStatusSchema });

export const adminUserResponseSchema = z.object({
  id: z.uuid(),
  authUserId: z.uuid().nullable(),
  email: z.string().email(),
  fullName: z.string().min(1),
  phone: z.string().nullable(),
  status: userStatusSchema,
  roles: z.array(adminRoleSchema),
  branchIds: z.array(z.uuid()),
  lastLoginAt: z.iso.datetime().nullable(),
  updatedAt: z.iso.datetime()
});

export const updateAdminUserAccessRequestSchema = z
  .object({
    status: userStatusSchema.optional(),
    roles: z.array(adminRoleSchema).min(1).max(5).optional(),
    branchIds: z.array(z.uuid()).max(100).optional()
  })
  .refine((value) => Object.keys(value).length > 0, 'Incluye al menos un cambio.');

export const createAdminUserAccessRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  fullName: z.string().trim().min(2).max(160),
  phone: nullableText(40),
  status: userStatusSchema.default('ACTIVE'),
  roles: z.array(adminRoleSchema).min(1).max(5),
  branchIds: z.array(z.uuid()).max(100).default([])
});

export const adminUserListResponseSchema = z.object({
  items: z.array(adminUserResponseSchema),
  pagination: adminPaginationMetaSchema
});

export const adminSiteSettingResponseSchema = z.object({
  id: z.uuid(),
  settingKey: z.string().min(1),
  settingValue: z.record(z.string(), z.unknown()),
  description: z.string().nullable(),
  isPublic: z.boolean(),
  updatedAt: z.iso.datetime()
});

export const upsertAdminSiteSettingRequestSchema = z.object({
  settingValue: z.record(z.string(), z.unknown()),
  description: nullableText(1_000),
  isPublic: z.boolean().default(false)
});

export const adminSiteSettingListResponseSchema = z.array(adminSiteSettingResponseSchema);

export const adminDashboardResponseSchema = z.object({
  activeProducts: z.int().min(0),
  activePromotions: z.int().min(0),
  pendingOrders: z.int().min(0),
  ordersToday: z.int().min(0),
  recentOrders: z.array(adminOrderResponseSchema)
});

export type AdminPaginationQuery = z.infer<typeof adminPaginationQuerySchema>;
export type AdminMeResponse = z.infer<typeof adminMeResponseSchema>;
export type AdminCategoryResponse = z.infer<typeof adminCategoryResponseSchema>;
export type AdminCategoryListResponse = z.infer<typeof adminCategoryListResponseSchema>;
export type CreateAdminCategoryRequest = z.infer<typeof createAdminCategoryRequestSchema>;
export type UpdateAdminCategoryRequest = z.infer<typeof updateAdminCategoryRequestSchema>;
export type AdminProductResponse = z.infer<typeof adminProductResponseSchema>;
export type AdminProductListResponse = z.infer<typeof adminProductListResponseSchema>;
export type CreateAdminProductRequest = z.infer<typeof createAdminProductRequestSchema>;
export type UpdateAdminProductRequest = z.infer<typeof updateAdminProductRequestSchema>;
export type UpdateBranchProductRequest = z.infer<typeof updateBranchProductRequestSchema>;
export type AdminBranchResponse = z.infer<typeof adminBranchResponseSchema>;
export type AdminBranchListResponse = z.infer<typeof adminBranchListResponseSchema>;
export type CreateAdminBranchRequest = z.infer<typeof createAdminBranchRequestSchema>;
export type UpdateAdminBranchRequest = z.infer<typeof updateAdminBranchRequestSchema>;
export type AdminPromotionResponse = z.infer<typeof adminPromotionResponseSchema>;
export type AdminPromotionListResponse = z.infer<typeof adminPromotionListResponseSchema>;
export type CreateAdminPromotionRequest = z.infer<typeof createAdminPromotionRequestSchema>;
export type UpdateAdminPromotionRequest = z.infer<typeof updateAdminPromotionRequestSchema>;
export type AdminOrderResponse = z.infer<typeof adminOrderResponseSchema>;
export type AdminOrderListResponse = z.infer<typeof adminOrderListResponseSchema>;
export type UpdateAdminOrderStatusRequest = z.infer<typeof updateAdminOrderStatusRequestSchema>;
export type AdminUserResponse = z.infer<typeof adminUserResponseSchema>;
export type AdminUserListResponse = z.infer<typeof adminUserListResponseSchema>;
export type UpdateAdminUserAccessRequest = z.infer<typeof updateAdminUserAccessRequestSchema>;
export type CreateAdminUserAccessRequest = z.infer<typeof createAdminUserAccessRequestSchema>;
export type AdminSiteSettingResponse = z.infer<typeof adminSiteSettingResponseSchema>;
export type AdminDashboardResponse = z.infer<typeof adminDashboardResponseSchema>;

function assertUniqueWeekdays(
  businessHours: Array<{ weekday: number }>,
  context: z.RefinementCtx
): void {
  const weekdays = new Set<number>();
  businessHours.forEach((businessHour, index) => {
    const hours = businessHour as {
      weekday: number;
      isClosed?: boolean;
      opensAt?: string | null;
      closesAt?: string | null;
    };
    if (
      hours.isClosed === false &&
      (!hours.opensAt || !hours.closesAt || hours.opensAt === hours.closesAt)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['businessHours', index],
        message: 'Ingresa apertura y cierre distintos para cada día habilitado.'
      });
    }
    if (weekdays.has(businessHour.weekday)) {
      context.addIssue({
        code: 'custom',
        path: ['businessHours', index, 'weekday'],
        message: 'Cada día solo puede tener un horario.'
      });
    }
    weekdays.add(businessHour.weekday);
  });
}

function validatePromotion(
  value: z.infer<typeof promotionFieldsSchema>,
  context: z.RefinementCtx
): void {
  if (new Date(value.startsAt) >= new Date(value.endsAt)) {
    context.addIssue({
      code: 'custom',
      path: ['endsAt'],
      message: 'El fin debe ser posterior al inicio.'
    });
  }

  if (value.promotionType === 'FIXED_PRICE' && !value.promoPrice) {
    context.addIssue({
      code: 'custom',
      path: ['promoPrice'],
      message: 'Ingresa el precio promocional.'
    });
  }
  if (value.promotionType === 'PERCENTAGE' && !value.discountPercent) {
    context.addIssue({
      code: 'custom',
      path: ['discountPercent'],
      message: 'Ingresa el porcentaje de descuento.'
    });
  }
  if (value.promotionType === 'FIXED_DISCOUNT' && !value.discountAmount) {
    context.addIssue({
      code: 'custom',
      path: ['discountAmount'],
      message: 'Ingresa el descuento fijo.'
    });
  }
  if (value.promotionType === 'PERCENTAGE' && value.discountPercent) {
    const percentage = Number(value.discountPercent);
    if (percentage <= 0 || percentage > 100) {
      context.addIssue({
        code: 'custom',
        path: ['discountPercent'],
        message: 'El porcentaje debe estar entre 0 y 100.'
      });
    }
  }
  if (value.promotionType === 'BUNDLE') {
    context.addIssue({
      code: 'custom',
      path: ['promotionType'],
      message: 'Las promociones bundle no están disponibles hasta implementar su composición.'
    });
  }

  const uniqueProducts = new Set(value.productIds);
  if (uniqueProducts.size !== value.productIds.length) {
    context.addIssue({
      code: 'custom',
      path: ['productIds'],
      message: 'Cada producto solo puede aparecer una vez.'
    });
  }
  const uniqueBranches = new Set(value.branchIds);
  if (uniqueBranches.size !== value.branchIds.length) {
    context.addIssue({
      code: 'custom',
      path: ['branchIds'],
      message: 'Cada sucursal solo puede aparecer una vez.'
    });
  }
}
