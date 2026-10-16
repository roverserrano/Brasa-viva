import { cache } from 'react';
import type { Metadata } from 'next';
import { productSeo, serializeJsonLd } from '../../../../lib/product-seo';
import { PublicLink as Link } from '../../../../components/site/public-link';
import { AddToCartButton } from '../../../../features/cart/add-to-cart-button';
import { getBranchProduct, getBranches } from '../../../../lib/api';
import { PageIntro } from '../../../../components/site/page-intro';
import { ProductPhoto } from '../../../../components/site/product-photo';
import { SiteIcon } from '../../../../components/site/site-icon';
import { menuHref, readMenuContext } from '../../../../lib/menu-navigation';

const loadProduct = cache((branch: string, slug: string) =>
  getBranchProduct(branch, slug).catch(() => null)
);

export async function generateMetadata({
  params,
  searchParams
}: ProductPageProps): Promise<Metadata> {
  const [{ productSlug }, search] = await Promise.all([params, searchParams]);
  const { branch } = readMenuContext(search);
  const product = branch ? await loadProduct(branch, productSlug) : null;
  if (!product) return { title: 'Elige tu producto', robots: { index: false, follow: true } };
  const seo = productSeo(product);
  return {
    title: seo.title,
    description: seo.description,
    ...(seo.canonical ? { alternates: { canonical: seo.canonical } } : {}),
    openGraph: {
      title: seo.title,
      description: seo.description,
      ...(seo.canonical ? { url: seo.canonical } : {}),
      ...(seo.imageUrl ? { images: [{ url: seo.imageUrl, alt: product.name }] } : {})
    }
  };
}
type ProductPageProps = {
  params: Promise<{ productSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const [{ productSlug }, search] = await Promise.all([params, searchParams]);
  const context = readMenuContext(search);
  const branchSlug = context.branch;
  const branches = !branchSlug ? await getBranches().catch(() => []) : [];
  const product = branchSlug ? await loadProduct(branchSlug, productSlug) : null;
  if (!branchSlug)
    return (
      <main className="public-container public-page">
        <PageIntro
          eyebrow="ANTES DE ELEGIR TU ANTOJO"
          title={
            <>
              Primero, <em>tu sucursal.</em>
            </>
          }
          description="Elige desde dónde pedir para ver el precio y la disponibilidad de este producto."
        />
        <nav className="public-actions" aria-label="Seleccionar sucursal">
          {branches.map((branch) => (
            <Link
              className="public-button"
              href={menuHref({ ...context, branch: branch.slug }, productSlug)}
              key={branch.id}
            >
              <SiteIcon name="pin" />
              {branch.name}
            </Link>
          ))}
        </nav>
        {!branches.length ? (
          <div className="public-empty">
            <p>No pudimos cargar las sucursales. Intenta nuevamente desde el menú.</p>
            <Link className="public-text-link" href="/menu">
              Volver al menú
            </Link>
          </div>
        ) : null}
      </main>
    );
  if (!product)
    return (
      <main className="public-container public-page">
        <PageIntro
          eyebrow="NO DISPONIBLE"
          title={
            <>
              Probemos con
              <br />
              <em>otro favorito.</em>
            </>
          }
          description="No pudimos cargar este producto en la sucursal seleccionada. Revisa otras opciones o inténtalo nuevamente."
        />
        <Link className="public-button" href={menuHref(context)}>
          Volver al menú <SiteIcon name="arrow" />
        </Link>
      </main>
    );
  return (
    <main className="public-container public-page">
      {productSeo(product).structuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(productSeo(product).structuredData) }}
        />
      ) : null}
      <Link className="public-breadcrumb" href={menuHref(context)}>
        ← Volver al menú de {product.branch.name}
      </Link>
      <article className="public-product-detail">
        <ProductPhoto
          imageUrl={product.imageUrl}
          name={product.name}
          featured={product.featured}
          priority
          sizes="(max-width: 767px) 90vw, 50vw"
        />
        <div>
          <p className="public-eyebrow">{product.category.name}</p>
          <h1 className="public-display">{product.name}</h1>
          <p className="public-product-price">Bs {product.price}</p>
          {product.description ? <p className="public-intro-copy">{product.description}</p> : null}
          <p className="public-image-note">
            <SiteIcon name="pin" /> {product.branch.name}
          </p>
          <AddToCartButton
            branch={{ id: product.branch.id, name: product.branch.name, slug: product.branch.slug }}
            product={{ id: product.id, name: product.name, price: product.price }}
          />
          <p className="public-image-note">
            Precio y disponibilidad confirmados al registrar tu pedido.
          </p>
        </div>
      </article>
    </main>
  );
}
