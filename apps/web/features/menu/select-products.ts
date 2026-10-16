import type { CatalogResponse, CategoryListResponse } from '@brasa-viva/contracts';
import { normalizeMenuSearch, type MenuContext } from '../../lib/menu-navigation';

export function selectProducts(
  products: CatalogResponse['products'],
  categories: CategoryListResponse,
  context: MenuContext
) {
  const categoryId = categories.find((category) => category.slug === context.category)?.id;
  const query = normalizeMenuSearch(context.q ?? '');
  const filtered = products.filter(
    (product) =>
      (!categoryId || product.categoryId === categoryId) &&
      normalizeMenuSearch(`${product.name} ${product.description ?? ''}`).includes(query)
  );
  if (context.sort) {
    const direction = context.sort === 'price-asc' ? 1 : -1;
    filtered.sort((a, b) => direction * (Number(a.price) - Number(b.price)));
  }
  return filtered;
}
