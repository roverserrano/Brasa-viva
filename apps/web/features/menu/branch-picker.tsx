'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { BranchListResponse } from '@brasa-viva/contracts';
import { SiteIcon } from '../../components/site/site-icon';
import { menuHref, readMenuContext } from '../../lib/menu-navigation';

export function BranchPicker({ branches }: { branches: BranchListResponse }) {
  const search = useSearchParams();
  const context = readMenuContext(Object.fromEntries(search.entries()));
  return (
    <section className="public-branch-picker" aria-labelledby="branch-picker-title">
      <div>
        <SiteIcon name="pin" />
        <div>
          <h2 id="branch-picker-title">¿Desde dónde pedirás?</h2>
          <small>Los precios y las opciones pueden variar por sucursal.</small>
        </div>
      </div>
      <nav aria-label="Seleccionar sucursal">
        {branches.map((branch) => (
          <Link
            className="public-branch-option"
            key={branch.id}
            aria-current={branch.slug === context.branch ? 'page' : undefined}
            href={menuHref({ ...context, branch: branch.slug })}
          >
            <SiteIcon name={branch.slug === context.branch ? 'check' : 'pin'} />
            {branch.name}
          </Link>
        ))}
      </nav>
    </section>
  );
}
