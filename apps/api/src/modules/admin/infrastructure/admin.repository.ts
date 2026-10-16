import { ConflictException, Inject, Injectable } from '@nestjs/common';
import {
  Prisma,
  type AuditAction,
  type OrderStatus,
  type UserStatus
} from '../../../../generated/prisma/client';
import type {
  AdminPaginationQuery,
  CreateAdminBranchRequest,
  CreateAdminCategoryRequest,
  CreateAdminProductRequest,
  CreateAdminPromotionRequest,
  CreateAdminUserAccessRequest,
  UpdateAdminBranchRequest,
  UpdateAdminCategoryRequest,
  UpdateAdminProductRequest,
  UpdateAdminPromotionRequest,
  UpdateAdminUserAccessRequest,
  UpdateBranchProductRequest
} from '@brasa-viva/contracts';
import { PrismaService } from '../../../database/prisma.service';
import {
  createAdminPromotionRequestSchema,
  permittedOrderTransitions
} from '@brasa-viva/contracts';

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  displayOrder: true,
  active: true,
  updatedAt: true
} satisfies Prisma.CategorySelect;

const productSelect = {
  id: true,
  categoryId: true,
  name: true,
  slug: true,
  description: true,
  basePrice: true,
  active: true,
  featured: true,
  isNew: true,
  seoTitle: true,
  seoDescription: true,
  updatedAt: true,
  category: { select: { name: true } },
  images: {
    where: { deletedAt: null, isPrimary: true },
    orderBy: { displayOrder: 'asc' },
    take: 1,
    select: { storagePath: true }
  },
  branches: {
    where: { deletedAt: null, branch: { deletedAt: null } },
    orderBy: { branch: { name: 'asc' } },
    select: {
      branchId: true,
      available: true,
      priceOverride: true,
      stockStatus: true,
      branch: { select: { name: true } }
    }
  }
} satisfies Prisma.ProductSelect;

const branchSelect = {
  id: true,
  code: true,
  name: true,
  slug: true,
  description: true,
  addressLine: true,
  city: true,
  department: true,
  countryCode: true,
  latitude: true,
  longitude: true,
  phone: true,
  whatsapp: true,
  googleMapsUrl: true,
  imageUrl: true,
  status: true,
  timezone: true,
  updatedAt: true,
  services: {
    where: { deletedAt: null, enabled: true },
    select: { serviceType: true }
  },
  businessHours: {
    where: { deletedAt: null },
    orderBy: { weekday: 'asc' },
    select: { weekday: true, opensAt: true, closesAt: true, isClosed: true }
  }
} satisfies Prisma.BranchSelect;

const promotionSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  promotionType: true,
  promoPrice: true,
  discountPercent: true,
  discountAmount: true,
  startsAt: true,
  endsAt: true,
  active: true,
  imageUrl: true,
  updatedAt: true,
  products: {
    where: { deletedAt: null },
    select: { productId: true }
  },
  branches: {
    where: { deletedAt: null },
    select: { branchId: true }
  }
} satisfies Prisma.PromotionSelect;

const orderSelect = {
  id: true,
  orderCode: true,
  branchId: true,
  status: true,
  orderType: true,
  customerName: true,
  customerPhone: true,
  deliveryAddress: true,
  notes: true,
  subtotal: true,
  discountTotal: true,
  deliveryFee: true,
  total: true,
  createdAt: true,
  updatedAt: true,
  branch: { select: { name: true } },
  items: {
    where: { deletedAt: null },
    select: {
      id: true,
      productNameSnapshot: true,
      quantity: true,
      unitPrice: true,
      discountAmount: true,
      lineTotal: true
    }
  }
} satisfies Prisma.OrderSelect;

const userSelect = {
  id: true,
  authUserId: true,
  email: true,
  fullName: true,
  phone: true,
  status: true,
  lastLoginAt: true,
  updatedAt: true,
  roles: {
    where: { deletedAt: null, role: { deletedAt: null } },
    select: { role: { select: { code: true } } }
  },
  branches: {
    where: { deletedAt: null },
    select: { branchId: true }
  }
} satisfies Prisma.UserSelect;

const siteSettingSelect = {
  id: true,
  settingKey: true,
  settingValue: true,
  description: true,
  isPublic: true,
  updatedAt: true
} satisfies Prisma.SiteSettingSelect;

export type AdminCategoryRecord = Prisma.CategoryGetPayload<{ select: typeof categorySelect }>;
export type AdminProductRecord = Prisma.ProductGetPayload<{ select: typeof productSelect }>;
export type AdminBranchRecord = Prisma.BranchGetPayload<{ select: typeof branchSelect }>;
export type AdminPromotionRecord = Prisma.PromotionGetPayload<{ select: typeof promotionSelect }>;
export type AdminOrderRecord = Prisma.OrderGetPayload<{ select: typeof orderSelect }>;
export type AdminUserRecord = Prisma.UserGetPayload<{ select: typeof userSelect }>;
export type AdminSiteSettingRecord = Prisma.SiteSettingGetPayload<{
  select: typeof siteSettingSelect;
}>;

type AuditInput = {
  actorUserId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class AdminRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listCategories(pagination: AdminPaginationQuery) {
    const where = { deletedAt: null };
    const [items, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        select: categorySelect,
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        skip: offset(pagination),
        take: pagination.pageSize
      }),
      this.prisma.category.count({ where })
    ]);
    return { items, total };
  }

  async createCategory(
    actorUserId: string,
    input: CreateAdminCategoryRequest
  ): Promise<AdminCategoryRecord> {
    return this.transaction(async (transaction) => {
      const created = await transaction.category.create({ data: input, select: categorySelect });
      await this.writeAudit(transaction, {
        actorUserId,
        action: 'INSERT',
        entityType: 'category',
        entityId: created.id,
        after: created
      });
      return created;
    });
  }

  async updateCategory(
    actorUserId: string,
    categoryId: string,
    input: UpdateAdminCategoryRequest
  ): Promise<AdminCategoryRecord | null> {
    return this.transaction(async (transaction) => {
      const before = await transaction.category.findFirst({
        where: { id: categoryId, deletedAt: null },
        select: categorySelect
      });
      if (!before) {
        return null;
      }
      const updated = await transaction.category.update({
        where: { id: categoryId },
        data: input,
        select: categorySelect
      });
      await this.writeAudit(transaction, {
        actorUserId,
        action: updated.active ? 'UPDATE' : 'SOFT_DELETE',
        entityType: 'category',
        entityId: categoryId,
        before,
        after: updated
      });
      return updated;
    });
  }

  async listProducts(pagination: AdminPaginationQuery) {
    const where = { deletedAt: null };
    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: productSelect,
        orderBy: { name: 'asc' },
        skip: offset(pagination),
        take: pagination.pageSize
      }),
      this.prisma.product.count({ where })
    ]);
    return { items, total };
  }

  async createProduct(
    actorUserId: string,
    input: CreateAdminProductRequest
  ): Promise<AdminProductRecord> {
    return this.transaction(async (transaction) => {
      await this.assertCategoryAndBranches(
        transaction,
        input.categoryId,
        input.branchAssignments.map((item) => item.branchId)
      );
      const created = await transaction.product.create({
        data: {
          categoryId: input.categoryId,
          name: input.name,
          slug: input.slug,
          description: input.description ?? null,
          basePrice: input.basePrice,
          active: input.active,
          featured: input.featured,
          isNew: input.isNew,
          seoTitle: input.seoTitle ?? null,
          seoDescription: input.seoDescription ?? null,
          ...(input.imageUrl
            ? {
                images: {
                  create: { storagePath: input.imageUrl, altText: input.name, isPrimary: true }
                }
              }
            : {}),
          ...(input.branchAssignments.length > 0
            ? {
                branches: {
                  create: input.branchAssignments.map((assignment) => ({
                    branchId: assignment.branchId,
                    available: assignment.available,
                    priceOverride: assignment.priceOverride,
                    stockStatus: assignment.stockStatus
                  }))
                }
              }
            : {})
        },
        select: productSelect
      });
      await this.writeAudit(transaction, {
        actorUserId,
        action: 'INSERT',
        entityType: 'product',
        entityId: created.id,
        after: created
      });
      return created;
    });
  }

  async updateProduct(
    actorUserId: string,
    productId: string,
    input: UpdateAdminProductRequest
  ): Promise<AdminProductRecord | null> {
    return this.transaction(async (transaction) => {
      const before = await transaction.product.findFirst({
        where: { id: productId, deletedAt: null },
        select: productSelect
      });
      if (!before) {
        return null;
      }
      if (input.categoryId) {
        await this.assertCategoryAndBranches(transaction, input.categoryId, []);
      }

      const { imageUrl, ...productFields } = input;
      if (Object.keys(productFields).length > 0) {
        await transaction.product.update({ where: { id: productId }, data: productFields });
      }
      if (imageUrl !== undefined) {
        await transaction.productImage.updateMany({
          where: { productId, deletedAt: null, isPrimary: true },
          data: { isPrimary: false }
        });
        if (imageUrl) {
          await transaction.productImage.create({
            data: {
              productId,
              storagePath: imageUrl,
              altText: input.name ?? before.name,
              isPrimary: true
            }
          });
        }
      }
      const updated = await transaction.product.findUniqueOrThrow({
        where: { id: productId },
        select: productSelect
      });
      await this.writeAudit(transaction, {
        actorUserId,
        action: updated.active ? 'UPDATE' : 'SOFT_DELETE',
        entityType: 'product',
        entityId: productId,
        before,
        after: updated
      });
      return updated;
    });
  }

  async updateBranchProduct(
    actorUserId: string,
    branchId: string,
    productId: string,
    input: UpdateBranchProductRequest
  ) {
    return this.transaction(async (transaction) => {
      const [branch, product] = await Promise.all([
        transaction.branch.findFirst({
          where: { id: branchId, deletedAt: null },
          select: { id: true }
        }),
        transaction.product.findFirst({
          where: { id: productId, deletedAt: null },
          select: { id: true }
        })
      ]);
      if (!branch || !product) {
        return null;
      }
      const before = await transaction.branchProduct.findUnique({
        where: { branchId_productId: { branchId, productId } }
      });
      const updated = await transaction.branchProduct.upsert({
        where: { branchId_productId: { branchId, productId } },
        update: { ...input, deletedAt: null },
        create: {
          branchId,
          productId,
          available: input.available ?? true,
          priceOverride: input.priceOverride ?? null,
          stockStatus: input.stockStatus ?? 'NOT_TRACKED'
        }
      });
      await this.writeAudit(transaction, {
        actorUserId,
        action: before ? 'UPDATE' : 'INSERT',
        entityType: 'branch_product',
        entityId: updated.id,
        before,
        after: updated,
        metadata: { branchId, productId }
      });
      return updated;
    });
  }

  async listBranches(pagination: AdminPaginationQuery) {
    const where = { deletedAt: null };
    const [items, total] = await Promise.all([
      this.prisma.branch.findMany({
        where,
        select: branchSelect,
        orderBy: { name: 'asc' },
        skip: offset(pagination),
        take: pagination.pageSize
      }),
      this.prisma.branch.count({ where })
    ]);
    return { items, total };
  }

  async createBranch(
    actorUserId: string,
    input: CreateAdminBranchRequest
  ): Promise<AdminBranchRecord> {
    return this.transaction(async (transaction) => {
      const created = await transaction.branch.create({
        data: {
          code: input.code,
          name: input.name,
          slug: input.slug,
          description: input.description ?? null,
          addressLine: input.addressLine,
          city: input.city,
          department: input.department,
          countryCode: input.countryCode,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          phone: input.phone ?? null,
          whatsapp: input.whatsapp ?? null,
          googleMapsUrl: input.googleMapsUrl ?? null,
          imageUrl: input.imageUrl ?? null,
          status: input.status,
          timezone: input.timezone,
          ...(input.services.length > 0
            ? {
                services: {
                  create: input.services.map((serviceType) => ({ serviceType, enabled: true }))
                }
              }
            : {}),
          ...(input.businessHours.length > 0
            ? {
                businessHours: {
                  create: input.businessHours.map((businessHour) => ({
                    weekday: businessHour.weekday,
                    opensAt: toTime(businessHour.opensAt),
                    closesAt: toTime(businessHour.closesAt),
                    isClosed: businessHour.isClosed
                  }))
                }
              }
            : {})
        },
        select: branchSelect
      });
      await this.writeAudit(transaction, {
        actorUserId,
        action: 'INSERT',
        entityType: 'branch',
        entityId: created.id,
        after: created
      });
      return created;
    });
  }

  async updateBranch(
    actorUserId: string,
    branchId: string,
    input: UpdateAdminBranchRequest
  ): Promise<AdminBranchRecord | null> {
    return this.transaction(async (transaction) => {
      const before = await transaction.branch.findFirst({
        where: { id: branchId, deletedAt: null },
        select: branchSelect
      });
      if (!before) {
        return null;
      }
      const { services, businessHours, ...branchFields } = input;
      if (Object.keys(branchFields).length > 0) {
        await transaction.branch.update({ where: { id: branchId }, data: branchFields });
      }
      if (services) {
        await transaction.branchService.updateMany({
          where: { branchId, deletedAt: null },
          data: { enabled: false }
        });
        for (const serviceType of services) {
          await transaction.branchService.upsert({
            where: { branchId_serviceType: { branchId, serviceType } },
            update: { enabled: true, deletedAt: null },
            create: { branchId, serviceType, enabled: true }
          });
        }
      }
      if (businessHours) {
        await transaction.branchBusinessHour.updateMany({
          where: { branchId, deletedAt: null },
          data: { deletedAt: new Date() }
        });
        for (const businessHour of businessHours) {
          await transaction.branchBusinessHour.upsert({
            where: { branchId_weekday: { branchId, weekday: businessHour.weekday } },
            update: {
              opensAt: toTime(businessHour.opensAt),
              closesAt: toTime(businessHour.closesAt),
              isClosed: businessHour.isClosed,
              deletedAt: null
            },
            create: {
              branchId,
              weekday: businessHour.weekday,
              opensAt: toTime(businessHour.opensAt),
              closesAt: toTime(businessHour.closesAt),
              isClosed: businessHour.isClosed
            }
          });
        }
      }
      const updated = await transaction.branch.findUniqueOrThrow({
        where: { id: branchId },
        select: branchSelect
      });
      await this.writeAudit(transaction, {
        actorUserId,
        action: updated.status === 'ACTIVE' ? 'UPDATE' : 'SOFT_DELETE',
        entityType: 'branch',
        entityId: branchId,
        before,
        after: updated
      });
      return updated;
    });
  }

  async listPromotions(pagination: AdminPaginationQuery) {
    const where = { deletedAt: null };
    const [items, total] = await Promise.all([
      this.prisma.promotion.findMany({
        where,
        select: promotionSelect,
        orderBy: { startsAt: 'desc' },
        skip: offset(pagination),
        take: pagination.pageSize
      }),
      this.prisma.promotion.count({ where })
    ]);
    return { items, total };
  }

  async createPromotion(
    actorUserId: string,
    input: CreateAdminPromotionRequest
  ): Promise<AdminPromotionRecord> {
    return this.transaction(async (transaction) => {
      await this.assertPromotionRelations(transaction, input.productIds, input.branchIds);
      const created = await transaction.promotion.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description ?? null,
          promotionType: input.promotionType,
          promoPrice: input.promoPrice ?? null,
          discountPercent: input.discountPercent ?? null,
          discountAmount: input.discountAmount ?? null,
          startsAt: new Date(input.startsAt),
          endsAt: new Date(input.endsAt),
          active: input.active,
          imageUrl: input.imageUrl ?? null,
          products: { create: input.productIds.map((productId) => ({ productId, quantity: 1 })) },
          ...(input.branchIds.length > 0
            ? { branches: { create: input.branchIds.map((branchId) => ({ branchId })) } }
            : {})
        },
        select: promotionSelect
      });
      await this.writeAudit(transaction, {
        actorUserId,
        action: 'INSERT',
        entityType: 'promotion',
        entityId: created.id,
        after: created
      });
      return created;
    });
  }

  async updatePromotion(
    actorUserId: string,
    promotionId: string,
    input: UpdateAdminPromotionRequest
  ): Promise<AdminPromotionRecord | null> {
    return this.transaction(async (transaction) => {
      const before = await transaction.promotion.findFirst({
        where: { id: promotionId, deletedAt: null },
        select: promotionSelect
      });
      if (!before) {
        return null;
      }
      if (input.active && before.products.length === 0 && !input.productIds?.length) {
        throw new ConflictException({
          code: 'PROMOTION_PRODUCT_REQUIRED',
          message: 'Asocia al menos un producto antes de activar la promoción.'
        });
      }
      if (input.productIds || input.branchIds) {
        await this.assertPromotionRelations(
          transaction,
          input.productIds ?? [],
          input.branchIds ?? []
        );
      }
      const merged = createAdminPromotionRequestSchema.safeParse({
        ...before,
        promoPrice: before.promoPrice?.toString() ?? null,
        discountPercent: before.discountPercent?.toString() ?? null,
        discountAmount: before.discountAmount?.toString() ?? null,
        startsAt: before.startsAt.toISOString(),
        endsAt: before.endsAt.toISOString(),
        productIds: before.products.map(({ productId }) => productId),
        branchIds: before.branches.map(({ branchId }) => branchId),
        ...input
      });
      // Legacy incomplete records can always be unpublished for later repair.
      const onlyUnpublishing = input.active === false && Object.keys(input).length === 1;
      if (!merged.success && !onlyUnpublishing) {
        throw new ConflictException({
          code: 'INVALID_PROMOTION',
          message: 'Revisa los productos, el descuento y las fechas de la promoción.',
          details: merged.error.flatten()
        });
      }
      const { productIds, branchIds, startsAt, endsAt, ...promotionFields } = input;
      await transaction.promotion.update({
        where: { id: promotionId },
        data: {
          ...promotionFields,
          ...(startsAt ? { startsAt: new Date(startsAt) } : {}),
          ...(endsAt ? { endsAt: new Date(endsAt) } : {})
        }
      });
      if (productIds) {
        await transaction.promotionProduct.updateMany({
          where: { promotionId, deletedAt: null },
          data: { deletedAt: new Date() }
        });
        for (const productId of productIds) {
          await transaction.promotionProduct.upsert({
            where: { promotionId_productId: { promotionId, productId } },
            update: { quantity: 1, deletedAt: null },
            create: { promotionId, productId, quantity: 1 }
          });
        }
      }
      if (branchIds) {
        await transaction.promotionBranch.updateMany({
          where: { promotionId, deletedAt: null },
          data: { deletedAt: new Date() }
        });
        for (const branchId of branchIds) {
          await transaction.promotionBranch.upsert({
            where: { promotionId_branchId: { promotionId, branchId } },
            update: { deletedAt: null },
            create: { promotionId, branchId }
          });
        }
      }
      const updated = await transaction.promotion.findUniqueOrThrow({
        where: { id: promotionId },
        select: promotionSelect
      });
      await this.writeAudit(transaction, {
        actorUserId,
        action: updated.active ? 'UPDATE' : 'SOFT_DELETE',
        entityType: 'promotion',
        entityId: promotionId,
        before,
        after: updated
      });
      return updated;
    });
  }

  async listOrders(pagination: AdminPaginationQuery, branchIds?: string[]) {
    const where = {
      deletedAt: null,
      ...(branchIds ? { branchId: { in: branchIds } } : {})
    };
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        select: orderSelect,
        orderBy: { createdAt: 'desc' },
        skip: offset(pagination),
        take: pagination.pageSize
      }),
      this.prisma.order.count({ where })
    ]);
    return { items, total };
  }

  async findOrder(orderId: string): Promise<AdminOrderRecord | null> {
    return this.prisma.order.findFirst({
      where: { id: orderId, deletedAt: null },
      select: orderSelect
    });
  }

  async updateOrderStatus(
    actorUserId: string,
    orderId: string,
    status: OrderStatus
  ): Promise<AdminOrderRecord | null> {
    return this.transaction(async (transaction) => {
      const before = await transaction.order.findFirst({
        where: { id: orderId, deletedAt: null },
        select: orderSelect
      });
      if (!before) {
        return null;
      }
      if (!permittedOrderTransitions[before.status]?.includes(status)) {
        throw new ConflictException({
          code: 'INVALID_ORDER_STATUS_TRANSITION',
          message: 'El pedido cambió de estado. Actualiza la lista antes de continuar.'
        });
      }
      const result = await transaction.order.updateMany({
        where: { id: orderId, status: before.status, deletedAt: null },
        data: { status }
      });
      if (result.count !== 1) {
        throw new ConflictException({
          code: 'ADMIN_CONFLICT',
          message: 'Otra persona actualizó el pedido. Actualiza la lista.'
        });
      }
      const updated = await transaction.order.findUniqueOrThrow({
        where: { id: orderId },
        select: orderSelect
      });
      await this.writeAudit(transaction, {
        actorUserId,
        action: 'UPDATE',
        entityType: 'order',
        entityId: orderId,
        before: { status: before.status },
        after: { status: updated.status },
        metadata: { branchId: updated.branchId }
      });
      return updated;
    });
  }

  async listUsers(pagination: AdminPaginationQuery) {
    const where = { deletedAt: null };
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: { email: 'asc' },
        skip: offset(pagination),
        take: pagination.pageSize
      }),
      this.prisma.user.count({ where })
    ]);
    return { items, total };
  }

  async findUser(userId: string): Promise<AdminUserRecord | null> {
    return this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: userSelect
    });
  }

  async countActiveOwners(): Promise<number> {
    return this.prisma.userRole.count({
      where: {
        deletedAt: null,
        role: { code: 'OWNER', deletedAt: null },
        user: { status: 'ACTIVE', deletedAt: null }
      }
    });
  }

  async createUserAccess(
    actorUserId: string,
    input: CreateAdminUserAccessRequest
  ): Promise<AdminUserRecord> {
    return this.transaction(async (transaction) => {
      const [roles, branches] = await Promise.all([
        transaction.role.findMany({
          where: { code: { in: input.roles }, deletedAt: null },
          select: { id: true }
        }),
        input.branchIds.length > 0
          ? transaction.branch.findMany({
              where: { id: { in: input.branchIds }, deletedAt: null },
              select: { id: true }
            })
          : Promise.resolve([])
      ]);
      if (roles.length !== input.roles.length) {
        throw new ConflictException({
          code: 'ADMIN_ROLE_NOT_FOUND',
          message: 'Uno de los roles seleccionados no está disponible.'
        });
      }
      if (branches.length !== input.branchIds.length) {
        throw new ConflictException({
          code: 'ADMIN_BRANCH_NOT_FOUND',
          message: 'Una de las sucursales seleccionadas no está disponible.'
        });
      }
      const created = await transaction.user.create({
        data: {
          email: input.email,
          fullName: input.fullName,
          phone: input.phone ?? null,
          status: input.status,
          roles: { create: roles.map((role) => ({ roleId: role.id })) },
          ...(input.branchIds.length > 0
            ? { branches: { create: input.branchIds.map((branchId) => ({ branchId })) } }
            : {})
        },
        select: userSelect
      });
      await this.writeAudit(transaction, {
        actorUserId,
        action: 'INSERT',
        entityType: 'user_access',
        entityId: created.id,
        after: created
      });
      return created;
    });
  }

  async updateUserAccess(
    actorUserId: string,
    userId: string,
    input: UpdateAdminUserAccessRequest
  ): Promise<AdminUserRecord | null> {
    return this.transaction(async (transaction) => {
      const before = await transaction.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: userSelect
      });
      if (!before) {
        return null;
      }
      const removingOwner =
        before.status === 'ACTIVE' &&
        before.roles.some(({ role }) => role.code === 'OWNER') &&
        ((input.roles !== undefined && !input.roles.includes('OWNER')) ||
          (input.status !== undefined && input.status !== 'ACTIVE'));
      if (removingOwner) {
        const owners = await transaction.userRole.count({
          where: {
            deletedAt: null,
            role: { code: 'OWNER', deletedAt: null },
            user: { status: 'ACTIVE', deletedAt: null }
          }
        });
        if (owners <= 1) {
          throw new ConflictException({
            code: 'LAST_OWNER_PROTECTED',
            message: 'Debe permanecer al menos un propietario activo.'
          });
        }
      }
      if (input.status) {
        await transaction.user.update({
          where: { id: userId },
          data: { status: input.status as UserStatus }
        });
      }
      if (input.roles) {
        const roles = await transaction.role.findMany({
          where: { code: { in: input.roles }, deletedAt: null },
          select: { id: true, code: true }
        });
        if (roles.length !== input.roles.length) {
          throw new ConflictException({
            code: 'ADMIN_ROLE_NOT_FOUND',
            message: 'Uno de los roles seleccionados no está disponible.'
          });
        }
        await transaction.userRole.updateMany({
          where: { userId, deletedAt: null },
          data: { deletedAt: new Date() }
        });
        for (const role of roles) {
          await transaction.userRole.upsert({
            where: { userId_roleId: { userId, roleId: role.id } },
            update: { deletedAt: null },
            create: { userId, roleId: role.id }
          });
        }
      }
      if (input.branchIds) {
        const branches = await transaction.branch.findMany({
          where: { id: { in: input.branchIds }, deletedAt: null },
          select: { id: true }
        });
        if (branches.length !== input.branchIds.length) {
          throw new ConflictException({
            code: 'ADMIN_BRANCH_NOT_FOUND',
            message: 'Una de las sucursales seleccionadas no está disponible.'
          });
        }
        await transaction.userBranch.updateMany({
          where: { userId, deletedAt: null },
          data: { deletedAt: new Date() }
        });
        for (const branchId of input.branchIds) {
          await transaction.userBranch.upsert({
            where: { userId_branchId: { userId, branchId } },
            update: { deletedAt: null },
            create: { userId, branchId }
          });
        }
      }
      const updated = await transaction.user.findUniqueOrThrow({
        where: { id: userId },
        select: userSelect
      });
      await this.writeAudit(transaction, {
        actorUserId,
        action: 'UPDATE',
        entityType: 'user_access',
        entityId: userId,
        before,
        after: updated
      });
      return updated;
    });
  }

  async listSettings(): Promise<AdminSiteSettingRecord[]> {
    return this.prisma.siteSetting.findMany({
      where: { deletedAt: null },
      select: siteSettingSelect,
      orderBy: { settingKey: 'asc' }
    });
  }

  async upsertSetting(
    actorUserId: string,
    settingKey: string,
    input: { settingValue: Record<string, unknown>; description?: string | null; isPublic: boolean }
  ): Promise<AdminSiteSettingRecord> {
    return this.transaction(async (transaction) => {
      const before = await transaction.siteSetting.findUnique({
        where: { settingKey },
        select: siteSettingSelect
      });
      const updated = await transaction.siteSetting.upsert({
        where: { settingKey },
        update: {
          settingValue: toJson(input.settingValue),
          description: input.description ?? null,
          isPublic: input.isPublic,
          deletedAt: null
        },
        create: {
          settingKey,
          settingValue: toJson(input.settingValue),
          description: input.description ?? null,
          isPublic: input.isPublic
        },
        select: siteSettingSelect
      });
      await this.writeAudit(transaction, {
        actorUserId,
        action: before ? 'UPDATE' : 'INSERT',
        entityType: 'site_setting',
        entityId: updated.id,
        before,
        after: updated
      });
      return updated;
    });
  }

  async getDashboard(branchIds?: string[]) {
    const branchFilter = branchIds ? { branchId: { in: branchIds } } : {};
    const startOfToday = laPazStartOfToday();
    const [activeProducts, activePromotions, pendingOrders, ordersToday, recentOrders] =
      await Promise.all([
        branchIds
          ? this.prisma.branchProduct.count({
              where: {
                ...branchFilter,
                deletedAt: null,
                available: true,
                product: { active: true, deletedAt: null }
              }
            })
          : this.prisma.product.count({ where: { active: true, deletedAt: null } }),
        this.prisma.promotion.count({
          where: {
            active: true,
            deletedAt: null,
            startsAt: { lte: new Date() },
            endsAt: { gt: new Date() },
            ...(branchIds
              ? {
                  OR: [
                    { branches: { none: { deletedAt: null } } },
                    { branches: { some: { branchId: { in: branchIds }, deletedAt: null } } }
                  ]
                }
              : {})
          }
        }),
        this.prisma.order.count({
          where: {
            deletedAt: null,
            ...branchFilter,
            status: { in: ['RECEIVED', 'CONFIRMED', 'PREPARING', 'READY'] }
          }
        }),
        this.prisma.order.count({
          where: { deletedAt: null, ...branchFilter, createdAt: { gte: startOfToday } }
        }),
        this.prisma.order.findMany({
          where: { deletedAt: null, ...branchFilter },
          select: orderSelect,
          orderBy: { createdAt: 'desc' },
          take: 5
        })
      ]);
    return { activeProducts, activePromotions, pendingOrders, ordersToday, recentOrders };
  }

  private async assertCategoryAndBranches(
    transaction: Prisma.TransactionClient,
    categoryId: string,
    branchIds: string[]
  ): Promise<void> {
    const [category, branches] = await Promise.all([
      transaction.category.findFirst({
        where: { id: categoryId, deletedAt: null },
        select: { id: true }
      }),
      branchIds.length > 0
        ? transaction.branch.findMany({
            where: { id: { in: branchIds }, deletedAt: null },
            select: { id: true }
          })
        : Promise.resolve([])
    ]);
    if (!category) {
      throw new ConflictException({
        code: 'ADMIN_CATEGORY_NOT_FOUND',
        message: 'La categoría seleccionada no está disponible.'
      });
    }
    if (branches.length !== branchIds.length) {
      throw new ConflictException({
        code: 'ADMIN_BRANCH_NOT_FOUND',
        message: 'Una de las sucursales seleccionadas no está disponible.'
      });
    }
  }

  private async assertPromotionRelations(
    transaction: Prisma.TransactionClient,
    productIds: string[],
    branchIds: string[]
  ): Promise<void> {
    const [products, branches] = await Promise.all([
      productIds.length > 0
        ? transaction.product.findMany({
            where: { id: { in: productIds }, deletedAt: null },
            select: { id: true }
          })
        : Promise.resolve([]),
      branchIds.length > 0
        ? transaction.branch.findMany({
            where: { id: { in: branchIds }, deletedAt: null },
            select: { id: true }
          })
        : Promise.resolve([])
    ]);
    if (productIds.length > 0 && products.length !== productIds.length) {
      throw new ConflictException({
        code: 'ADMIN_PRODUCT_NOT_FOUND',
        message: 'Uno de los productos seleccionados no está disponible.'
      });
    }
    if (branches.length !== branchIds.length) {
      throw new ConflictException({
        code: 'ADMIN_BRANCH_NOT_FOUND',
        message: 'Una de las sucursales seleccionadas no está disponible.'
      });
    }
  }

  private async transaction<T>(
    operation: (transaction: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    try {
      return await this.prisma.$transaction((transaction) => operation(transaction), {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictException({
          code: 'ADMIN_CONFLICT',
          message:
            'Otra persona está actualizando estos datos. Actualiza la pantalla e intenta nuevamente.'
        });
      }
      if (isUniqueConstraintError(error)) {
        throw new ConflictException({
          code: 'ADMIN_CONFLICT',
          message: 'Ya existe un registro con uno de los valores indicados.'
        });
      }
      throw error;
    }
  }

  private async writeAudit(
    transaction: Prisma.TransactionClient,
    input: AuditInput
  ): Promise<void> {
    await transaction.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        beforeJson: input.before === undefined ? undefined : toJson(input.before),
        afterJson: input.after === undefined ? undefined : toJson(input.after),
        metadata: input.metadata === undefined ? undefined : toJson(input.metadata)
      }
    });
  }
}

function offset(pagination: AdminPaginationQuery): number {
  return (pagination.page - 1) * pagination.pageSize;
}

function toTime(value: string | null): Date | null {
  return value ? new Date(`1970-01-01T${value}:00.000Z`) : null;
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function isUniqueConstraintError(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

function laPazStartOfToday(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '';

  return new Date(`${value('year')}-${value('month')}-${value('day')}T00:00:00-04:00`);
}
