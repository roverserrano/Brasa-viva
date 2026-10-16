import {
  branchListResponseSchema,
  branchDetailResponseSchema,
  categoryListResponseSchema,
  catalogResponseSchema,
  createOrderResponseSchema,
  productDetailResponseSchema,
  promotionListResponseSchema,
  type BranchListResponse,
  type BranchDetailResponse,
  type CategoryListResponse,
  type CatalogResponse,
  type CreateOrderRequest,
  type CreateOrderResponse
} from '@brasa-viva/contracts';

const localDevelopmentApiBaseUrl = 'http://127.0.0.1:4000/api/v1';

export function resolveApiBaseUrl(
  configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL,
  nodeEnvironment = process.env.NODE_ENV
): string | undefined {
  const apiBaseUrl =
    configuredApiBaseUrl ??
    (nodeEnvironment === 'development' ? localDevelopmentApiBaseUrl : undefined);

  return apiBaseUrl?.replace(/\/$/, '');
}

const apiBaseUrl = resolveApiBaseUrl();

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
  }
}

async function requestJson(path: string, init?: RequestInit): Promise<unknown> {
  if (!apiBaseUrl) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL no está configurada.');
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
    ...init,
    headers: {
      Accept: 'application/json',
      ...init?.headers
    }
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      code?: unknown;
      message?: unknown;
    } | null;
    const message =
      typeof error?.message === 'string'
        ? error.message
        : `La API respondió con ${response.status}.`;
    const code = typeof error?.code === 'string' ? error.code : undefined;

    throw new ApiRequestError(message, response.status, code);
  }

  return response.json();
}

async function getJson(path: string): Promise<unknown> {
  return requestJson(path);
}

export async function getBranches(): Promise<BranchListResponse> {
  return branchListResponseSchema.parse(await getJson('/branches'));
}

export async function getBranchDetail(slug: string): Promise<BranchDetailResponse> {
  return branchDetailResponseSchema.parse(await getJson(`/branches/${encodeURIComponent(slug)}`));
}

export async function getBranchMenu(slug: string): Promise<CatalogResponse> {
  return catalogResponseSchema.parse(await getJson(`/branches/${encodeURIComponent(slug)}/menu`));
}

export async function getPromotions(branchSlug?: string) {
  const query = branchSlug ? `?branchSlug=${encodeURIComponent(branchSlug)}` : '';
  return promotionListResponseSchema.parse(await getJson(`/promotions${query}`));
}

export async function getCategories(): Promise<CategoryListResponse> {
  return categoryListResponseSchema.parse(await getJson('/categories'));
}

export async function getBranchProduct(branchSlug: string, productSlug: string) {
  return productDetailResponseSchema.parse(
    await getJson(
      `/branches/${encodeURIComponent(branchSlug)}/menu/${encodeURIComponent(productSlug)}`
    )
  );
}

export async function createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
  return createOrderResponseSchema.parse(
    await requestJson('/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    })
  );
}
