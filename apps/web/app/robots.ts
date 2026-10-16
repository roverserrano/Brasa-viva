import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/carrito', '/pedido'] },
    ...(url ? { sitemap: `${url}/sitemap.xml` } : {})
  };
}
