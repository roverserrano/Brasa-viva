import type { ReactNode } from 'react';
import { PublicLink as Link } from '../../components/site/public-link';
import { BrandMark } from '../../components/site/brand-mark';

export default function CheckoutLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="public-shell checkout-shell min-h-screen">
      <header className="checkout-header">
        <div className="public-container">
          <BrandMark />
          <Link className="public-text-link" href="/menu">
            Seguir eligiendo <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </header>
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
      <footer className="checkout-footer public-container">
        Hecho para compartir. Brasa Viva · Cochabamba
      </footer>
    </div>
  );
}
