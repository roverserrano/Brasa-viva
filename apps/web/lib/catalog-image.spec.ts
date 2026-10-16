import { describe, expect, it } from 'vitest';
import { resolveCatalogImage } from './catalog-image';

describe('catalog image origins', () => {
  const origin = 'https://project.supabase.co';
  it('allows local assets and only public Storage paths on the configured origin', () => {
    expect(resolveCatalogImage('/images/photo.webp', origin)).toBe('/images/photo.webp');
    const image = `${origin}/storage/v1/object/public/products/photo.webp`;
    expect(resolveCatalogImage(image, origin)).toBe(image);
  });
  it('rejects other hosts, unsafe schemes, credentials and private Storage paths', () => {
    for (const source of [
      'https://evil.test/photo.webp',
      'javascript:alert(1)',
      'data:image/svg+xml,test',
      'https://user:password@project.supabase.co/storage/v1/object/public/photo.webp',
      `${origin}/storage/v1/object/authenticated/photo.webp`,
      'http://project.supabase.co/storage/v1/object/public/photo.webp'
    ])
      expect(resolveCatalogImage(source, origin)).toBeNull();
    expect(resolveCatalogImage(null, origin)).toBeNull();
  });
});
