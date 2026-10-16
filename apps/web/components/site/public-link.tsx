'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { useCartStore } from '../../features/cart/cart-store';
import { useCartReady } from '../../features/cart/use-cart-ready';
import { withCartBranch } from '../../lib/menu-navigation';

/** General menu links resume the current cart; explicit branch choices always win. */
export function PublicLink({
  href,
  ...props
}: Omit<ComponentProps<typeof Link>, 'href'> & { href: string }) {
  const branch = useCartStore((state) => state.branch);
  const ready = useCartReady();
  return <Link {...props} href={withCartBranch(href, ready ? branch?.slug : undefined)} />;
}
