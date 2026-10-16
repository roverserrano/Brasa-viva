import { describe, expect, it } from 'vitest';
import type { CatalogResponse, CategoryListResponse } from '@brasa-viva/contracts';
import { selectProducts } from './select-products';

const categories: CategoryListResponse = [
  { id: 'a', slug: 'pollos', name: 'Pollos', description: null },
  { id: 'b', slug: 'bebidas', name: 'Bebidas', description: null }
];
const products: CatalogResponse['products'] = [
  {
    id: '1',
    categoryId: 'a',
    name: 'Pollo clásico',
    slug: 'pollo',
    price: '100.00',
    description: null,
    available: true,
    featured: true,
    imageUrl: null
  },
  {
    id: '2',
    categoryId: 'b',
    name: 'Limonada',
    slug: 'limonada',
    price: '9.50',
    description: 'Con limón',
    available: true,
    featured: false,
    imageUrl: null
  },
  {
    id: '3',
    categoryId: 'a',
    name: 'Broaster',
    slug: 'broaster',
    price: '32.00',
    description: 'Clásico con papas',
    available: true,
    featured: false,
    imageUrl: null
  }
];

describe('catalog selection', () => {
  it('combines category, accent-insensitive search and numeric price across categories', () => {
    expect(
      selectProducts(products, categories, {
        q: 'CLASICO',
        category: 'pollos',
        sort: 'price-asc'
      }).map((p) => p.id)
    ).toEqual(['3', '1']);
    expect(selectProducts(products, categories, { sort: 'price-desc' }).map((p) => p.id)).toEqual([
      '1',
      '3',
      '2'
    ]);
    expect(selectProducts(products, categories, { sort: 'price-asc' }).map((p) => p.id)).toEqual([
      '2',
      '3',
      '1'
    ]);
    expect(products.map((p) => p.id)).toEqual(['1', '2', '3']);
  });
  it('keeps server order by default, ignores unknown category and supports empty results', () => {
    expect(selectProducts(products, categories, { category: 'missing' })).toEqual(products);
    expect(selectProducts(products, categories, { q: 'no existe' })).toEqual([]);
  });
});
