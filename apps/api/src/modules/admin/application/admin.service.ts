import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import {
  adminBranchListResponseSchema,
  adminBranchResponseSchema,
  adminCategoryListResponseSchema,
  adminCategoryResponseSchema,
  adminDashboardResponseSchema,
  adminMeResponseSchema,
  adminOrderListResponseSchema,
  adminOrderResponseSchema,
  adminProductListResponseSchema,
  adminProductResponseSchema,
  adminPromotionListResponseSchema,
  adminPromotionResponseSchema,
  adminSiteSettingListResponseSchema,
  adminSiteSettingResponseSchema,
  adminUserListResponseSchema,
  adminUserResponseSchema,
  type AdminBranchListResponse,
  type AdminBranchResponse,
  type AdminCategoryListResponse,
  type AdminCategoryResponse,
  type AdminDashboardResponse,
  type AdminMeResponse,
  type AdminOrderListResponse,
  type AdminOrderResponse,
  type AdminPaginationQuery,
  type AdminProductListResponse,
  type AdminProductResponse,
  type AdminPromotionListResponse,
  type AdminPromotionResponse,
  type AdminSiteSettingResponse,
  type AdminUserListResponse,
  type AdminUserResponse,
  type CreateAdminBranchRequest,
  type CreateAdminCategoryRequest,
  type CreateAdminProductRequest,
  type CreateAdminPromotionRequest,
  type CreateAdminUserAccessRequest,
  type UpdateAdminBranchRequest,
  type UpdateAdminCategoryRequest,
  type UpdateAdminOrderStatusRequest,
  type UpdateAdminProductRequest,
  type UpdateAdminPromotionRequest,
  type UpdateAdminUserAccessRequest,
  type UpdateBranchProductRequest
} from '@brasa-viva/contracts';
import {
  adminCapabilities,
  canAccessBranch,
  type AdminCapability,
  type AdminPrincipal
} from '../../auth/domain/admin-policy';
import {
  AdminRepository,
  type AdminBranchRecord,
  type AdminCategoryRecord,
  type AdminOrderRecord,
  type AdminProductRecord,
  type AdminPromotionRecord,
  type AdminSiteSettingRecord,
  type AdminUserRecord
} from '../infrastructure/admin.repository';

import { permittedOrderTransitions } from '@brasa-viva/contracts';

@Injectable()
export class AdminService {
  constructor(@Inject(AdminRepository) private readonly adminRepository: AdminRepository) {}

  getMe(principal: AdminPrincipal): AdminMeResponse {
    return adminMeResponseSchema.parse({
      id: principal.userId,
      email: principal.email,
      fullName: principal.fullName,
      roles: principal.roles,
      branchIds: principal.branchIds
    });
  }

  async getDashboard(principal: AdminPrincipal): Promise<AdminDashboardResponse> {
    const branchIds = this.branchScopeForRead(principal);
    const dashboard = await this.adminRepository.getDashboard(branchIds);
    return adminDashboardResponseSchema.parse({
      ...dashboard,
      recentOrders: dashboard.recentOrders.map((order) => this.toOrderResponse(order))
    });
  }

  async listCategories(pagination: AdminPaginationQuery): Promise<AdminCategoryListResponse> {
    const result = await this.adminRepository.listCategories(pagination);
    return adminCategoryListResponseSchema.parse({
      items: result.items.map((category) => this.toCategoryResponse(category)),
      pagination: toPagination(result.total, pagination)
    });
  }

  async createCategory(
    principal: AdminPrincipal,
    input: CreateAdminCategoryRequest
  ): Promise<AdminCategoryResponse> {
    return this.toCategoryResponse(
      await this.adminRepository.createCategory(principal.userId, input)
    );
  }

  async updateCategory(
    principal: AdminPrincipal,
    categoryId: string,
    input: UpdateAdminCategoryRequest
  ): Promise<AdminCategoryResponse> {
    const category = await this.adminRepository.updateCategory(principal.userId, categoryId, input);
    if (!category) {
      throw notFound('ADMIN_CATEGORY_NOT_FOUND', 'La categoría no existe.');
    }
    return this.toCategoryResponse(category);
  }

  async listProducts(
    principal: AdminPrincipal,
    pagination: AdminPaginationQuery
  ): Promise<AdminProductListResponse> {
    const result = await this.adminRepository.listProducts(pagination);
    const visibleBranchIds =
      principal.roles.includes('BRANCH_MANAGER') && !principal.roles.includes('EDITOR')
        ? principal.branchIds
        : undefined;
    return adminProductListResponseSchema.parse({
      items: result.items.map((product) => this.toProductResponse(product, visibleBranchIds)),
      pagination: toPagination(result.total, pagination)
    });
  }

  async createProduct(
    principal: AdminPrincipal,
    input: CreateAdminProductRequest
  ): Promise<AdminProductResponse> {
    return this.toProductResponse(
      await this.adminRepository.createProduct(principal.userId, input)
    );
  }

  async updateProduct(
    principal: AdminPrincipal,
    productId: string,
    input: UpdateAdminProductRequest
  ): Promise<AdminProductResponse> {
    const product = await this.adminRepository.updateProduct(principal.userId, productId, input);
    if (!product) {
      throw notFound('ADMIN_PRODUCT_NOT_FOUND', 'El producto no existe.');
    }
    return this.toProductResponse(product);
  }

  async updateBranchProduct(
    principal: AdminPrincipal,
    branchId: string,
    productId: string,
    input: UpdateBranchProductRequest
  ): Promise<void> {
    this.assertBranchScope(principal, branchId, adminCapabilities.manageBranchOperations);
    const assignment = await this.adminRepository.updateBranchProduct(
      principal.userId,
      branchId,
      productId,
      input
    );
    if (!assignment) {
      throw notFound('ADMIN_BRANCH_PRODUCT_NOT_FOUND', 'El producto o la sucursal no existen.');
    }
  }

  async listBranches(pagination: AdminPaginationQuery): Promise<AdminBranchListResponse> {
    const result = await this.adminRepository.listBranches(pagination);
    return adminBranchListResponseSchema.parse({
      items: result.items.map((branch) => this.toBranchResponse(branch)),
      pagination: toPagination(result.total, pagination)
    });
  }

  async createBranch(
    principal: AdminPrincipal,
    input: CreateAdminBranchRequest
  ): Promise<AdminBranchResponse> {
    return this.toBranchResponse(await this.adminRepository.createBranch(principal.userId, input));
  }

  async updateBranch(
    principal: AdminPrincipal,
    branchId: string,
    input: UpdateAdminBranchRequest
  ): Promise<AdminBranchResponse> {
    const branch = await this.adminRepository.updateBranch(principal.userId, branchId, input);
    if (!branch) {
      throw notFound('ADMIN_BRANCH_NOT_FOUND', 'La sucursal no existe.');
    }
    return this.toBranchResponse(branch);
  }

  async listPromotions(pagination: AdminPaginationQuery): Promise<AdminPromotionListResponse> {
    const result = await this.adminRepository.listPromotions(pagination);
    return adminPromotionListResponseSchema.parse({
      items: result.items.map((promotion) => this.toPromotionResponse(promotion)),
      pagination: toPagination(result.total, pagination)
    });
  }

  async createPromotion(
    principal: AdminPrincipal,
    input: CreateAdminPromotionRequest
  ): Promise<AdminPromotionResponse> {
    return this.toPromotionResponse(
      await this.adminRepository.createPromotion(principal.userId, input)
    );
  }

  async updatePromotion(
    principal: AdminPrincipal,
    promotionId: string,
    input: UpdateAdminPromotionRequest
  ): Promise<AdminPromotionResponse> {
    const promotion = await this.adminRepository.updatePromotion(
      principal.userId,
      promotionId,
      input
    );
    if (!promotion) {
      throw notFound('ADMIN_PROMOTION_NOT_FOUND', 'La promoción no existe.');
    }
    return this.toPromotionResponse(promotion);
  }

  async listOrders(
    principal: AdminPrincipal,
    pagination: AdminPaginationQuery
  ): Promise<AdminOrderListResponse> {
    const result = await this.adminRepository.listOrders(
      pagination,
      this.branchScopeForRead(principal)
    );
    return adminOrderListResponseSchema.parse({
      items: result.items.map((order) => this.toOrderResponse(order)),
      pagination: toPagination(result.total, pagination)
    });
  }

  async updateOrderStatus(
    principal: AdminPrincipal,
    orderId: string,
    input: UpdateAdminOrderStatusRequest
  ): Promise<AdminOrderResponse> {
    const order = await this.adminRepository.findOrder(orderId);
    if (!order) {
      throw notFound('ADMIN_ORDER_NOT_FOUND', 'El pedido no existe.');
    }
    this.assertBranchScope(principal, order.branchId, adminCapabilities.updateOrderStatus);

    const nextStatuses = permittedOrderTransitions[order.status] ?? [];
    if (!nextStatuses.includes(input.status)) {
      throw new ConflictException({
        code: 'INVALID_ORDER_STATUS_TRANSITION',
        message: 'El pedido no puede cambiar a ese estado.'
      });
    }

    const updated = await this.adminRepository.updateOrderStatus(
      principal.userId,
      orderId,
      input.status
    );
    if (!updated) {
      throw notFound('ADMIN_ORDER_NOT_FOUND', 'El pedido no existe.');
    }
    return this.toOrderResponse(updated);
  }

  async listUsers(pagination: AdminPaginationQuery): Promise<AdminUserListResponse> {
    const result = await this.adminRepository.listUsers(pagination);
    return adminUserListResponseSchema.parse({
      items: result.items.map((user) => this.toUserResponse(user)),
      pagination: toPagination(result.total, pagination)
    });
  }

  async createUserAccess(
    principal: AdminPrincipal,
    input: CreateAdminUserAccessRequest
  ): Promise<AdminUserResponse> {
    return this.toUserResponse(
      await this.adminRepository.createUserAccess(principal.userId, input)
    );
  }

  async updateUserAccess(
    principal: AdminPrincipal,
    userId: string,
    input: UpdateAdminUserAccessRequest
  ): Promise<AdminUserResponse> {
    const targetUser = await this.adminRepository.findUser(userId);
    if (!targetUser) {
      throw notFound('ADMIN_USER_NOT_FOUND', 'El usuario no existe.');
    }

    const currentlyOwner = targetUser.roles.some(({ role }) => role.code === 'OWNER');
    const remainsOwner = input.roles ? input.roles.includes('OWNER') : currentlyOwner;
    const remainsActive = input.status ? input.status === 'ACTIVE' : targetUser.status === 'ACTIVE';
    if (currentlyOwner && (!remainsOwner || !remainsActive)) {
      const activeOwnerCount = await this.adminRepository.countActiveOwners();
      if (activeOwnerCount <= 1) {
        throw new ConflictException({
          code: 'LAST_OWNER_PROTECTED',
          message: 'Debe permanecer al menos un propietario activo.'
        });
      }
    }

    const updated = await this.adminRepository.updateUserAccess(principal.userId, userId, input);
    if (!updated) {
      throw notFound('ADMIN_USER_NOT_FOUND', 'El usuario no existe.');
    }
    return this.toUserResponse(updated);
  }

  async listSettings(): Promise<AdminSiteSettingResponse[]> {
    const settings = await this.adminRepository.listSettings();
    return adminSiteSettingListResponseSchema.parse(
      settings.map((setting) => this.toSettingResponse(setting))
    );
  }

  async upsertSetting(
    principal: AdminPrincipal,
    settingKey: string,
    input: { settingValue: Record<string, unknown>; description?: string | null; isPublic: boolean }
  ): Promise<AdminSiteSettingResponse> {
    return this.toSettingResponse(
      await this.adminRepository.upsertSetting(principal.userId, settingKey, input)
    );
  }

  private branchScopeForRead(principal: AdminPrincipal): string[] | undefined {
    if (principal.roles.includes('OWNER') || principal.roles.includes('ADMIN')) {
      return undefined;
    }

    return principal.branchIds;
  }

  private assertBranchScope(
    principal: AdminPrincipal,
    branchId: string,
    capability: AdminCapability
  ): void {
    if (!canAccessBranch(principal, branchId, capability)) {
      throw new ForbiddenException({
        code: 'ADMIN_BRANCH_SCOPE_DENIED',
        message: 'No tienes acceso a esta sucursal.'
      });
    }
  }

  private toCategoryResponse(category: AdminCategoryRecord): AdminCategoryResponse {
    return adminCategoryResponseSchema.parse({
      ...category,
      updatedAt: category.updatedAt.toISOString()
    });
  }

  private toProductResponse(
    product: AdminProductRecord,
    visibleBranchIds?: string[]
  ): AdminProductResponse {
    return adminProductResponseSchema.parse({
      id: product.id,
      categoryId: product.categoryId,
      categoryName: product.category.name,
      name: product.name,
      slug: product.slug,
      description: product.description,
      basePrice: product.basePrice.toString(),
      active: product.active,
      featured: product.featured,
      isNew: product.isNew,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      imageUrl: product.images[0]?.storagePath ?? null,
      branchAssignments: product.branches
        .filter((assignment) => !visibleBranchIds || visibleBranchIds.includes(assignment.branchId))
        .map((assignment) => ({
          branchId: assignment.branchId,
          branchName: assignment.branch.name,
          available: assignment.available,
          priceOverride: assignment.priceOverride?.toString() ?? null,
          stockStatus: assignment.stockStatus
        })),
      updatedAt: product.updatedAt.toISOString()
    });
  }

  private toBranchResponse(branch: AdminBranchRecord): AdminBranchResponse {
    return adminBranchResponseSchema.parse({
      ...branch,
      latitude: branch.latitude?.toString() ?? null,
      longitude: branch.longitude?.toString() ?? null,
      services: branch.services.map((service) => service.serviceType),
      businessHours: branch.businessHours.map((businessHour) => ({
        weekday: businessHour.weekday,
        opensAt: timeToString(businessHour.opensAt),
        closesAt: timeToString(businessHour.closesAt),
        isClosed: businessHour.isClosed
      })),
      updatedAt: branch.updatedAt.toISOString()
    });
  }

  private toPromotionResponse(promotion: AdminPromotionRecord): AdminPromotionResponse {
    return adminPromotionResponseSchema.parse({
      id: promotion.id,
      name: promotion.name,
      slug: promotion.slug,
      description: promotion.description,
      promotionType: promotion.promotionType,
      promoPrice: promotion.promoPrice?.toString() ?? null,
      discountPercent: promotion.discountPercent?.toString() ?? null,
      discountAmount: promotion.discountAmount?.toString() ?? null,
      startsAt: promotion.startsAt.toISOString(),
      endsAt: promotion.endsAt.toISOString(),
      active: promotion.active,
      imageUrl: promotion.imageUrl,
      productIds: promotion.products.map(({ productId }) => productId),
      branchIds: promotion.branches.map(({ branchId }) => branchId),
      updatedAt: promotion.updatedAt.toISOString()
    });
  }

  private toOrderResponse(order: AdminOrderRecord): AdminOrderResponse {
    return adminOrderResponseSchema.parse({
      id: order.id,
      orderCode: order.orderCode,
      branchId: order.branchId,
      branchName: order.branch.name,
      status: order.status,
      orderType: order.orderType,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deliveryAddress: order.deliveryAddress,
      notes: order.notes,
      subtotal: order.subtotal.toString(),
      discountTotal: order.discountTotal.toString(),
      deliveryFee: order.deliveryFee.toString(),
      total: order.total.toString(),
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.productNameSnapshot,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        discountAmount: item.discountAmount.toString(),
        lineTotal: item.lineTotal.toString()
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString()
    });
  }

  private toUserResponse(user: AdminUserRecord): AdminUserResponse {
    return adminUserResponseSchema.parse({
      id: user.id,
      authUserId: user.authUserId,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      status: user.status,
      roles: user.roles.map(({ role }) => role.code),
      branchIds: user.branches.map(({ branchId }) => branchId),
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      updatedAt: user.updatedAt.toISOString()
    });
  }

  private toSettingResponse(setting: AdminSiteSettingRecord): AdminSiteSettingResponse {
    return adminSiteSettingResponseSchema.parse({
      ...setting,
      updatedAt: setting.updatedAt.toISOString()
    });
  }
}

function toPagination(total: number, pagination: AdminPaginationQuery) {
  return { total, page: pagination.page, pageSize: pagination.pageSize };
}

function notFound(code: string, message: string): NotFoundException {
  return new NotFoundException({ code, message });
}

function timeToString(value: Date | null): string | null {
  return value ? value.toISOString().slice(11, 16) : null;
}
