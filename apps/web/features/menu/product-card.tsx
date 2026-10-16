import Link from 'next/link';
import type { CatalogResponse } from '@brasa-viva/contracts';
import { ProductPhoto } from '../../components/site/product-photo';
import { formatBs } from '../../lib/format';
import { menuHref, type MenuContext } from '../../lib/menu-navigation';
import { AddToCartButton } from '../cart/add-to-cart-button';

export function ProductCard({
  product,
  branch,
  context
}: {
  product: CatalogResponse['products'][number];
  branch: CatalogResponse['branch'];
  context: MenuContext;
}) {
  const href = menuHref(context, product.slug);
  return (
    <article className="menu-product-card">
      <Link aria-label={`Ver ${product.name}`} href={href}>
        <ProductPhoto imageUrl={product.imageUrl} name={product.name} featured={product.featured} />
      </Link>
      <div className="menu-product-body">
        <div className="menu-product-title-row">
          <h4>
            <Link href={href}>{product.name}</Link>
          </h4>
          <span className="menu-product-price">{formatBs(product.price)}</span>
        </div>
        <p>{product.description || 'Consulta los detalles de este producto.'}</p>
        <AddToCartButton branch={branch} product={product} />
      </div>
    </article>
  );
}
