import type { ReactNode } from 'react';
import { SiteFooter } from '../../components/site/site-footer';
import { SiteHeader } from '../../components/site/site-header';
import { CartQuickAction } from '../../features/cart/cart-summary-link';
import { MobileNavigation } from '../../components/site/mobile-navigation';

export default function PublicLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="public-shell flex min-h-screen flex-col pb-24">
      <SiteHeader />
      <div id="main-content" tabIndex={-1} className="flex-1">
        {children}
      </div>
      <SiteFooter />
      <CartQuickAction />
      <MobileNavigation />
    </div>
  );
}
