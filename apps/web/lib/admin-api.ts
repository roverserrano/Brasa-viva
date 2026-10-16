'use client';

import {
  adminBranchListResponseSchema,
  adminBranchResponseSchema,
  adminCategoryListResponseSchema,
  adminCategoryResponseSchema,
  adminDashboardResponseSchema,
  dashboardInsightsSchema,
  type DashboardQuery,
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
import { getAccessToken } from './supabase-auth';
import { resolveApiBaseUrl } from './api';
import {
  createAdminBranchRequestSchema,
  updateAdminBranchRequestSchema,
  createAdminCategoryRequestSchema,
  updateAdminCategoryRequestSchema,
  createAdminProductRequestSchema,
  updateAdminProductRequestSchema,
  createAdminPromotionRequestSchema,
  updateAdminPromotionRequestSchema,
  createAdminUserAccessRequestSchema,
  updateAdminUserAccessRequestSchema,
  updateAdminOrderStatusRequestSchema,
  updateBranchProductRequestSchema,
  upsertAdminSiteSettingRequestSchema
} from '@brasa-viva/contracts';
import type { z } from 'zod';

const apiBaseUrl = resolveApiBaseUrl();

export class AdminApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
  }
}

export async function getAdminMe() {
  return adminMeResponseSchema.parse(await request('/admin/me'));
}

export async function getAdminDashboard() {
  return adminDashboardResponseSchema.parse(await request('/admin/dashboard'));
}

export async function getDashboardInsights(query: DashboardQuery) {
  const params = new URLSearchParams({ days: String(query.days) });
  if (query.branchId) params.set('branchId', query.branchId);
  return dashboardInsightsSchema.parse(await request(`/admin/dashboard/insights?${params}`));
}

export async function getAdminCategories(page = 1) {
  return adminCategoryListResponseSchema.parse(
    await request(`/admin/categories?pageSize=100&page=${page}`)
  );
}

export async function createAdminCategory(input: CreateAdminCategoryRequest) {
  return adminCategoryResponseSchema.parse(await request('/admin/categories', json('POST', input)));
}

export async function updateAdminCategory(id: string, input: UpdateAdminCategoryRequest) {
  return adminCategoryResponseSchema.parse(
    await request(`/admin/categories/${id}`, json('PATCH', input))
  );
}

export async function getAdminProducts(page = 1) {
  return adminProductListResponseSchema.parse(
    await request(`/admin/products?pageSize=100&page=${page}`)
  );
}

export async function createAdminProduct(input: CreateAdminProductRequest) {
  return adminProductResponseSchema.parse(await request('/admin/products', json('POST', input)));
}

export async function updateAdminProduct(id: string, input: UpdateAdminProductRequest) {
  return adminProductResponseSchema.parse(
    await request(`/admin/products/${id}`, json('PATCH', input))
  );
}

export async function updateAdminBranchProduct(
  branchId: string,
  productId: string,
  input: UpdateBranchProductRequest
) {
  await request(`/admin/branches/${branchId}/products/${productId}`, json('PUT', input));
}

export async function getAdminBranches(page = 1) {
  return adminBranchListResponseSchema.parse(
    await request(`/admin/branches?pageSize=100&page=${page}`)
  );
}

export async function createAdminBranch(input: CreateAdminBranchRequest) {
  return adminBranchResponseSchema.parse(await request('/admin/branches', json('POST', input)));
}

export async function updateAdminBranch(id: string, input: UpdateAdminBranchRequest) {
  return adminBranchResponseSchema.parse(
    await request(`/admin/branches/${id}`, json('PATCH', input))
  );
}

export async function getAdminPromotions(page = 1) {
  return adminPromotionListResponseSchema.parse(
    await request(`/admin/promotions?pageSize=100&page=${page}`)
  );
}

export async function createAdminPromotion(input: CreateAdminPromotionRequest) {
  return adminPromotionResponseSchema.parse(
    await request('/admin/promotions', json('POST', input))
  );
}

export async function updateAdminPromotion(id: string, input: UpdateAdminPromotionRequest) {
  return adminPromotionResponseSchema.parse(
    await request(`/admin/promotions/${id}`, json('PATCH', input))
  );
}

export async function getAdminOrders(page = 1) {
  return adminOrderListResponseSchema.parse(
    await request(`/admin/orders?pageSize=25&page=${page}`)
  );
}

export async function updateAdminOrderStatus(id: string, input: UpdateAdminOrderStatusRequest) {
  return adminOrderResponseSchema.parse(
    await request(`/admin/orders/${id}/status`, json('PATCH', input))
  );
}

export async function getAdminUsers(page = 1) {
  return adminUserListResponseSchema.parse(await request(`/admin/users?pageSize=100&page=${page}`));
}

export async function createAdminUserAccess(input: CreateAdminUserAccessRequest) {
  return adminUserResponseSchema.parse(await request('/admin/users', json('POST', input)));
}

export async function updateAdminUserAccess(id: string, input: UpdateAdminUserAccessRequest) {
  return adminUserResponseSchema.parse(
    await request(`/admin/users/${id}/access`, json('PUT', input))
  );
}

export async function getAdminSettings() {
  return adminSiteSettingListResponseSchema.parse(await request('/admin/settings'));
}

export async function upsertAdminSetting(
  key: string,
  input: { settingValue: Record<string, unknown>; description?: string | null; isPublic: boolean }
) {
  return adminSiteSettingResponseSchema.parse(
    await request(`/admin/settings/${encodeURIComponent(key)}`, json('PUT', input))
  );
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  if (!apiBaseUrl)
    throw new AdminApiError(
      'La conexión del panel no está configurada. Contacta al administrador.',
      0
    );
  if (typeof init?.body === 'string') {
    const schema = requestSchema(path, init.method);
    if (schema) validateAdminInput(schema, JSON.parse(init.body));
  }
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new AdminApiError('La sesión administrativa expiró.', 401, 'ADMIN_AUTH_REQUIRED');
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
      ...init,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...init?.headers
      }
    });
  } catch {
    throw new AdminApiError(
      'No pudimos conectar. Revisa tu conexión e intenta nuevamente; tus cambios siguen en el formulario.',
      0
    );
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      code?: unknown;
      message?: unknown;
    } | null;
    throw new AdminApiError(
      typeof error?.message === 'string' ? error.message : 'No fue posible completar la operación.',
      response.status,
      typeof error?.code === 'string' ? error.code : undefined
    );
  }

  if (response.status === 204) {
    return undefined;
  }
  return response.json();
}

function json(method: 'POST' | 'PATCH' | 'PUT', body: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

function requestSchema(path: string, method?: string): z.ZodType | undefined {
  if (path.includes('/access')) return updateAdminUserAccessRequestSchema;
  if (path.includes('/status')) return updateAdminOrderStatusRequestSchema;
  if (/\/branches\/[^/]+\/products\//.test(path)) return updateBranchProductRequestSchema;
  if (path.startsWith('/admin/settings/')) return upsertAdminSiteSettingRequestSchema;
  const resource = path.split('/')[2];
  const schemas = {
    categories: [createAdminCategoryRequestSchema, updateAdminCategoryRequestSchema],
    products: [createAdminProductRequestSchema, updateAdminProductRequestSchema],
    branches: [createAdminBranchRequestSchema, updateAdminBranchRequestSchema],
    promotions: [createAdminPromotionRequestSchema, updateAdminPromotionRequestSchema],
    users: [createAdminUserAccessRequestSchema, updateAdminUserAccessRequestSchema]
  };
  return resource && resource in schemas
    ? schemas[resource as keyof typeof schemas][method === 'POST' ? 0 : 1]
    : undefined;
}

function validateAdminInput(schema: z.ZodType, input: unknown): void {
  const parsed = schema.safeParse(input);
  if (parsed.success) return;
  const fieldLabels: Record<string, string> = {
    name: 'Nombre',
    slug: 'Enlace del menú',
    basePrice: 'Precio',
    productIds: 'Productos incluidos',
    branchIds: 'Sucursales',
    categoryId: 'Categoría',
    imageUrl: 'Imagen',
    endsAt: 'Fecha de fin',
    startsAt: 'Fecha de inicio',
    discountPercent: 'Porcentaje',
    promoPrice: 'Precio promocional',
    email: 'Correo',
    roles: 'Roles',
    fullName: 'Nombre completo'
  };
  const messages = parsed.error.issues.map((issue) => {
    const field = String(issue.path[0] ?? '');
    if (field === 'productIds' && issue.code === 'too_small')
      return 'Selecciona al menos un producto.';
    return `${fieldLabels[field] ?? 'Datos'}: ${issue.code === 'custom' ? issue.message : 'revisa el valor ingresado.'}`;
  });
  throw new AdminApiError([...new Set(messages)].join(' '), 400, 'INVALID_ADMIN_REQUEST');
}

async function collectOptions<T>(
  fetchPage: (
    page: number
  ) => Promise<{ items: T[]; pagination: { total: number; pageSize: number } }>
): Promise<{ items: T[] }> {
  const first = await fetchPage(1);
  const items = [...first.items];
  const pages = Math.ceil(first.pagination.total / first.pagination.pageSize);
  for (let page = 2; page <= pages; page += 1) items.push(...(await fetchPage(page)).items);
  return { items };
}
export const getAdminCategoryOptions = () => collectOptions(getAdminCategories);
export const getAdminProductOptions = () => collectOptions(getAdminProducts);
export const getAdminBranchOptions = () => collectOptions(getAdminBranches);
