import { describe, expect, it } from 'vitest';
import type { ProductDetailResponse } from '@brasa-viva/contracts';
import { productSeo, serializeJsonLd } from './product-seo';

const product: ProductDetailResponse = {
  id: '1',
  categoryId: '2',
  name: 'Broaster',
  slug: 'broaster',
  description: 'Con papas',
  price: '32.50',
  available: true,
  featured: false,
  imageUrl: null,
  branch: {
    id: '3',
    name: 'Centro',
    slug: 'centro',
    address: 'Av. Central',
    whatsapp: null,
    active: true
  },
  category: { id: '2', name: 'Pollos', slug: 'pollos', description: null }
};

describe('product SEO', () => {
  it('uses the real branch price and a canonical without incidental filters', () => {
    const seo = productSeo(product, 'https://brasa.example');
    expect(seo.canonical).toBe('https://brasa.example/menu/broaster?branch=centro');
    expect(seo.title).toBe('Broaster · Centro');
    expect(seo.structuredData?.offers).toMatchObject({
      price: '32.50',
      priceCurrency: 'BOB',
      availability: 'https://schema.org/InStock'
    });
    expect(seo.structuredData).not.toHaveProperty('aggregateRating');
    expect(seo.structuredData).not.toHaveProperty('image');
    expect(
      productSeo({ ...product, available: false }, 'https://brasa.example').structuredData?.offers
        .availability
    ).toContain('OutOfStock');
  });
  it('does not invent a canonical when the public domain is missing or invalid', () => {
    for (const url of [
      '',
      'invalid',
      'javascript:alert(1)',
      'https://user:password@example.test'
    ]) {
      expect(productSeo(product, url).structuredData).toBeNull();
      expect(productSeo(product, url).canonical).toBeUndefined();
    }
  });
  it('escapes script-breaking catalog content without altering the parsed data', () => {
    const value = { name: '</script><script>alert(1)</script>', description: 'Pollo & papas' };
    const serialized = serializeJsonLd(value);
    expect(serialized).not.toContain('<');
    expect(JSON.parse(serialized)).toEqual(value);
  });
});
