import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import {
  adminPaginationQuerySchema,
  dashboardQuerySchema,
  dashboardInsightsSchema,
  createAdminBranchRequestSchema,
  createAdminCategoryRequestSchema,
  createAdminProductRequestSchema,
  createAdminPromotionRequestSchema,
  createAdminUserAccessRequestSchema,
  updateAdminBranchRequestSchema,
  updateAdminCategoryRequestSchema,
  updateAdminOrderStatusRequestSchema,
  updateAdminProductRequestSchema,
  updateAdminPromotionRequestSchema,
  updateAdminUserAccessRequestSchema,
  updateBranchProductRequestSchema,
  upsertAdminSiteSettingRequestSchema
} from '@brasa-viva/contracts';
import { z } from 'zod';
import type { ApiResponseSchemaHost } from '@nestjs/swagger';
import { CurrentAdmin, RequireAdminCapabilities } from '../auth/auth.decorators';
import { AdminAuthGuard, AdminAuthorizationGuard } from '../auth/auth.guards';
import { adminCapabilities, type AdminPrincipal } from '../auth/domain/admin-policy';
import { AdminService } from './application/admin.service';
import { DashboardService } from './application/dashboard.service';

const uuidSchema = z.uuid();
const settingKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/);

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(AdminAuthGuard, AdminAuthorizationGuard)
export class AdminController {
  constructor(
    @Inject(AdminService) private readonly adminService: AdminService,
    @Inject(DashboardService) private readonly dashboardService: DashboardService
  ) {}

  @Get('dashboard/insights')
  @ApiOkResponse({
    schema: z.toJSONSchema(dashboardInsightsSchema, {
      target: 'openapi-3.0'
    }) as ApiResponseSchemaHost['schema']
  })
  @RequireAdminCapabilities(adminCapabilities.viewDashboard)
  @ApiOperation({
    summary:
      'Resumen ejecutivo por fecha de creación, zona America/La_Paz. Importes sin cancelados; no representan cobros. Incluye hoy parcial y compara el período anterior completo.'
  })
  @ApiQuery({ name: 'days', required: false, enum: [7, 30, 90] })
  @ApiQuery({ name: 'branchId', required: false, type: String, format: 'uuid' })
  getInsights(@CurrentAdmin() principal: AdminPrincipal, @Query() query: unknown) {
    return this.dashboardService.getInsights(principal, parseRequest(dashboardQuerySchema, query));
  }

  @Get('me')
  @ApiOperation({ summary: 'Obtiene la identidad y alcance administrativo actual.' })
  getMe(@CurrentAdmin() principal: AdminPrincipal) {
    return this.adminService.getMe(principal);
  }

  @Get('dashboard')
  @RequireAdminCapabilities(adminCapabilities.viewDashboard)
  @ApiOperation({ summary: 'Obtiene indicadores operativos autorizados.' })
  getDashboard(@CurrentAdmin() principal: AdminPrincipal) {
    return this.adminService.getDashboard(principal);
  }

  @Get('categories')
  @RequireAdminCapabilities(adminCapabilities.viewCatalog)
  listCategories(@Query() query: unknown) {
    return this.adminService.listCategories(parseRequest(adminPaginationQuerySchema, query));
  }

  @Post('categories')
  @RequireAdminCapabilities(adminCapabilities.manageCatalog)
  createCategory(@CurrentAdmin() principal: AdminPrincipal, @Body() body: unknown) {
    return this.adminService.createCategory(
      principal,
      parseRequest(createAdminCategoryRequestSchema, body)
    );
  }

  @Patch('categories/:id')
  @RequireAdminCapabilities(adminCapabilities.manageCatalog)
  updateCategory(
    @CurrentAdmin() principal: AdminPrincipal,
    @Param('id') id: string,
    @Body() body: unknown
  ) {
    return this.adminService.updateCategory(
      principal,
      parseId(id),
      parseRequest(updateAdminCategoryRequestSchema, body)
    );
  }

  @Get('products')
  @RequireAdminCapabilities(adminCapabilities.viewCatalog)
  listProducts(@CurrentAdmin() principal: AdminPrincipal, @Query() query: unknown) {
    return this.adminService.listProducts(
      principal,
      parseRequest(adminPaginationQuerySchema, query)
    );
  }

  @Post('products')
  @RequireAdminCapabilities(adminCapabilities.manageCatalog)
  createProduct(@CurrentAdmin() principal: AdminPrincipal, @Body() body: unknown) {
    return this.adminService.createProduct(
      principal,
      parseRequest(createAdminProductRequestSchema, body)
    );
  }

  @Patch('products/:id')
  @RequireAdminCapabilities(adminCapabilities.manageCatalog)
  updateProduct(
    @CurrentAdmin() principal: AdminPrincipal,
    @Param('id') id: string,
    @Body() body: unknown
  ) {
    return this.adminService.updateProduct(
      principal,
      parseId(id),
      parseRequest(updateAdminProductRequestSchema, body)
    );
  }

  @Put('branches/:branchId/products/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireAdminCapabilities(adminCapabilities.manageBranchOperations)
  updateBranchProduct(
    @CurrentAdmin() principal: AdminPrincipal,
    @Param('branchId') branchId: string,
    @Param('productId') productId: string,
    @Body() body: unknown
  ) {
    return this.adminService.updateBranchProduct(
      principal,
      parseId(branchId),
      parseId(productId),
      parseRequest(updateBranchProductRequestSchema, body)
    );
  }

  @Get('branches')
  @RequireAdminCapabilities(adminCapabilities.manageBranches)
  listBranches(@Query() query: unknown) {
    return this.adminService.listBranches(parseRequest(adminPaginationQuerySchema, query));
  }

  @Post('branches')
  @RequireAdminCapabilities(adminCapabilities.manageBranches)
  createBranch(@CurrentAdmin() principal: AdminPrincipal, @Body() body: unknown) {
    return this.adminService.createBranch(
      principal,
      parseRequest(createAdminBranchRequestSchema, body)
    );
  }

  @Patch('branches/:id')
  @RequireAdminCapabilities(adminCapabilities.manageBranches)
  updateBranch(
    @CurrentAdmin() principal: AdminPrincipal,
    @Param('id') id: string,
    @Body() body: unknown
  ) {
    return this.adminService.updateBranch(
      principal,
      parseId(id),
      parseRequest(updateAdminBranchRequestSchema, body)
    );
  }

  @Get('promotions')
  @RequireAdminCapabilities(adminCapabilities.managePromotions)
  listPromotions(@Query() query: unknown) {
    return this.adminService.listPromotions(parseRequest(adminPaginationQuerySchema, query));
  }

  @Post('promotions')
  @RequireAdminCapabilities(adminCapabilities.managePromotions)
  createPromotion(@CurrentAdmin() principal: AdminPrincipal, @Body() body: unknown) {
    return this.adminService.createPromotion(
      principal,
      parseRequest(createAdminPromotionRequestSchema, body)
    );
  }

  @Patch('promotions/:id')
  @RequireAdminCapabilities(adminCapabilities.managePromotions)
  updatePromotion(
    @CurrentAdmin() principal: AdminPrincipal,
    @Param('id') id: string,
    @Body() body: unknown
  ) {
    return this.adminService.updatePromotion(
      principal,
      parseId(id),
      parseRequest(updateAdminPromotionRequestSchema, body)
    );
  }

  @Get('orders')
  @RequireAdminCapabilities(adminCapabilities.viewOrders)
  listOrders(@CurrentAdmin() principal: AdminPrincipal, @Query() query: unknown) {
    return this.adminService.listOrders(principal, parseRequest(adminPaginationQuerySchema, query));
  }

  @Patch('orders/:id/status')
  @RequireAdminCapabilities(adminCapabilities.updateOrderStatus)
  updateOrderStatus(
    @CurrentAdmin() principal: AdminPrincipal,
    @Param('id') id: string,
    @Body() body: unknown
  ) {
    return this.adminService.updateOrderStatus(
      principal,
      parseId(id),
      parseRequest(updateAdminOrderStatusRequestSchema, body)
    );
  }

  @Get('users')
  @RequireAdminCapabilities(adminCapabilities.manageUsers)
  listUsers(@Query() query: unknown) {
    return this.adminService.listUsers(parseRequest(adminPaginationQuerySchema, query));
  }

  @Post('users')
  @RequireAdminCapabilities(adminCapabilities.manageUsers)
  createUserAccess(@CurrentAdmin() principal: AdminPrincipal, @Body() body: unknown) {
    return this.adminService.createUserAccess(
      principal,
      parseRequest(createAdminUserAccessRequestSchema, body)
    );
  }

  @Put('users/:id/access')
  @RequireAdminCapabilities(adminCapabilities.manageUsers)
  updateUserAccess(
    @CurrentAdmin() principal: AdminPrincipal,
    @Param('id') id: string,
    @Body() body: unknown
  ) {
    return this.adminService.updateUserAccess(
      principal,
      parseId(id),
      parseRequest(updateAdminUserAccessRequestSchema, body)
    );
  }

  @Get('settings')
  @RequireAdminCapabilities(adminCapabilities.manageSettings)
  listSettings() {
    return this.adminService.listSettings();
  }

  @Put('settings/:settingKey')
  @RequireAdminCapabilities(adminCapabilities.manageSettings)
  upsertSetting(
    @CurrentAdmin() principal: AdminPrincipal,
    @Param('settingKey') settingKey: string,
    @Body() body: unknown
  ) {
    return this.adminService.upsertSetting(
      principal,
      parseRequest(settingKeySchema, settingKey),
      parseRequest(upsertAdminSiteSettingRequestSchema, body)
    );
  }
}

function parseId(value: string): string {
  return parseRequest(uuidSchema, value);
}

function parseRequest<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new BadRequestException({
      code: 'INVALID_ADMIN_REQUEST',
      message: 'Los datos administrativos no son válidos.',
      details: parsed.error.flatten()
    });
  }
  return parsed.data;
}
