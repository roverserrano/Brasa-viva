'use client';

import Link from 'next/link';
import { useCartReady } from './use-cart-ready';
import { useCartStore } from './cart-store';
import { SiteIcon } from '../../components/site/site-icon';

export function CartSummaryLink() {
  const items = useCartStore((state) => state.items);
  const ready = useCartReady();
  const count = ready ? items.reduce((total, item) => total + item.quantity, 0) : 0;
  return (
    <>
      <Link
        className="site-cart-link"
        href="/carrito"
        aria-label={`Carrito${count ? `: ${count} productos` : ''}`}
      >
        <SiteIcon name="bag" />
        <span className="site-cart-label">Carrito</span>{' '}
        {count ? <span className="site-cart-count">{count}</span> : null}
      </Link>
      <span className="sr-only" role="status" aria-atomic="true">
        {ready && count ? `${count} productos en tu carrito` : ''}
      </span>
    </>
  );
}

export function CartQuickAction() {
  const items = useCartStore((state) => state.items);
  const branch = useCartStore((state) => state.branch);
  const ready = useCartReady();
  if (!ready || !items.length) return null;
  const count = items.reduce((total, item) => total + item.quantity, 0);
  return (
    <div className="cart-quick-action">
      <Link href="/carrito">
        <span className="cart-quick-description">
          {count} {count === 1 ? 'producto' : 'productos'} en tu carrito
          {branch ? <small>{branch.name}</small> : null}
        </span>
        <strong>Revisar pedido →</strong>
      </Link>
    </div>
  );
}
