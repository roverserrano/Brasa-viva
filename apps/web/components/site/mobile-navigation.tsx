'use client';

import { usePathname } from 'next/navigation';
import { PublicLink } from './public-link';
import { SiteIcon } from './site-icon';
import { useCartStore } from '../../features/cart/cart-store';
import { useCartReady } from '../../features/cart/use-cart-ready';

const destinations = [
  { href: '/', label: 'Inicio', icon: 'home' },
  { href: '/menu', label: 'Menú', icon: 'flame' },
  { href: '/sucursales', label: 'Sucursales', icon: 'pin' },
  { href: '/carrito', label: 'Carrito', icon: 'bag' }
] as const;

export function MobileNavigation() {
  const pathname = usePathname();
  const ready = useCartReady();
  const items = useCartStore((state) => state.items);
  const count = ready ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;
  return (
    <nav className="site-mobile-dock" aria-label="Accesos rápidos">
      {destinations.map((item) => (
        <PublicLink
          key={item.href}
          href={item.href}
          aria-current={
            pathname === item.href || (item.href !== '/' && pathname.startsWith(`${item.href}/`))
              ? 'page'
              : undefined
          }
        >
          <span className="dock-icon">
            <SiteIcon name={item.icon} />
            {item.href === '/carrito' && count ? (
              <span className="dock-count">
                {count}
                <span className="sr-only"> productos</span>
              </span>
            ) : null}
          </span>
          <span>{item.label}</span>
        </PublicLink>
      ))}
    </nav>
  );
}
