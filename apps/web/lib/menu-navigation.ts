export type MenuSort = 'price-asc' | 'price-desc';
export type MenuContext = { branch?: string; q?: string; category?: string; sort?: MenuSort };

export function readMenuContext(params: Record<string, unknown>): MenuContext {
  const context: MenuContext = Object.fromEntries(
    ['branch', 'q', 'category'].flatMap((key) => {
      const value = params[key];
      return typeof value === 'string' && value.trim() ? [[key, value.trim().slice(0, 160)]] : [];
    })
  );
  if (params.sort === 'price-asc' || params.sort === 'price-desc') context.sort = params.sort;
  return context;
}

export function menuHref(context: MenuContext = {}, productSlug?: string): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(context)) if (value) params.set(key, value);
  const query = params.toString();
  return `/menu${productSlug ? `/${encodeURIComponent(productSlug)}` : ''}${query ? `?${query}` : ''}`;
}

export function withCartBranch(href: string, branchSlug?: string): string {
  if (!branchSlug || !href.startsWith('/menu')) return href;
  const url = new URL(href, 'https://brasa.invalid');
  if (url.pathname !== '/menu' || url.searchParams.has('branch')) return href;
  url.searchParams.set('branch', branchSlug);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function normalizeMenuSearch(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').trim().toLocaleLowerCase('es');
}
