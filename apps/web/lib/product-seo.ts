import type { ProductDetailResponse } from '@brasa-viva/contracts';
import { resolveCatalogImage } from './catalog-image';
import { menuHref } from './menu-navigation';

export function productSeo(
  product: ProductDetailResponse,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL
) {
  const title = `${product.name} · ${product.branch.name}`;
  const description = `${product.description || product.name} Pídelo en ${product.branch.name}, Cochabamba. Coordina tu pedido por WhatsApp.`;
  let canonical: string | undefined;
  try {
    const origin = new URL(siteUrl ?? '');
    if (['https:', 'http:'].includes(origin.protocol) && !origin.username && !origin.password) {
      canonical = new URL(menuHref({ branch: product.branch.slug }, product.slug), origin).href;
    }
  } catch {
    /* Local previews need no invented public domain. */
  }
  const image = resolveCatalogImage(product.imageUrl);
  const imageUrl = image && canonical ? new URL(image, canonical).href : undefined;
  return {
    title,
    description,
    canonical,
    imageUrl,
    structuredData: canonical
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: product.description || product.name,
          ...(imageUrl ? { image: [imageUrl] } : {}),
          brand: { '@type': 'Brand', name: 'Brasa Viva' },
          offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'BOB',
            url: canonical,
            availability: `https://schema.org/${product.available ? 'InStock' : 'OutOfStock'}`,
            seller: { '@type': 'Organization', name: product.branch.name }
          }
        }
      : null
  };
}

/** Catalog copy must never be able to close a JSON-LD script element. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
