import type { MetadataRoute } from 'next';
import { getBranches, getBranchMenu } from '../lib/api';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (!base) return [];
  const paths = new Set(['/', '/menu', '/promociones', '/sucursales', '/nosotros', '/contacto']);
  const branches = await getBranches().catch(() => []);
  await Promise.all(
    branches.map(async (branch) => {
      paths.add(`/sucursales/${encodeURIComponent(branch.slug)}`);
      const menu = await getBranchMenu(branch.slug).catch(() => null);
      menu?.products.forEach((product) =>
        paths.add(
          `/menu/${encodeURIComponent(product.slug)}?branch=${encodeURIComponent(branch.slug)}`
        )
      );
    })
  );
  return [...paths].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: 'weekly',
    priority: path === '/' ? 1 : 0.7
  }));
}
