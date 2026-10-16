'use client';

import { PublicLink as Link } from './public-link';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import { BrandMark } from './brand-mark';
import { SiteIcon } from './site-icon';
import { CartSummaryLink } from '../../features/cart/cart-summary-link';

const navigation = [
  { href: '/menu', label: 'Menú' },
  { href: '/promociones', label: 'Promociones' },
  { href: '/sucursales', label: 'Sucursales' },
  { href: '/nosotros', label: 'Nosotros' }
];

export function SiteHeader() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  return (
    <header
      className="site-header"
      onClick={(event) => {
        if (expanded && event.target instanceof Element && event.target.closest('a'))
          setExpanded(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && expanded) {
          setExpanded(false);
          toggle.current?.focus();
        }
      }}
    >
      <div className="site-header-inner">
        <BrandMark />
        <nav
          aria-label="Navegación principal"
          className={`site-nav${expanded ? ' site-nav-open' : ''}`}
          id="public-navigation"
        >
          {navigation.map((item) => (
            <Link
              aria-current={
                pathname === item.href || pathname.startsWith(`${item.href}/`) ? 'page' : undefined
              }
              href={item.href}
              key={item.href}
              onClick={() => setExpanded(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            className="public-button site-nav-order"
            href="/menu"
            onClick={() => setExpanded(false)}
          >
            Elegir mi pedido <SiteIcon name="arrow" />
          </Link>
        </nav>
        <div className="site-header-actions">
          <CartSummaryLink />
          <Link className="public-button site-header-order" href="/menu">
            Pedir ahora <SiteIcon name="arrow" />
          </Link>
          <button
            className="site-menu-toggle"
            ref={toggle}
            type="button"
            aria-label={expanded ? 'Cerrar navegación' : 'Abrir navegación'}
            aria-expanded={expanded}
            aria-controls="public-navigation"
            onClick={() => setExpanded(!expanded)}
          >
            <SiteIcon name={expanded ? 'close' : 'menu'} />
          </button>
        </div>
      </div>
    </header>
  );
}
