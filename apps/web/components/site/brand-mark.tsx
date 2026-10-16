import Link from 'next/link';
import { SiteIcon } from './site-icon';

type BrandMarkProps = {
  compact?: boolean;
  inverse?: boolean;
};

export function BrandMark({ compact = false, inverse = false }: BrandMarkProps) {
  return (
    <Link
      aria-label="Ir al inicio de Brasa Viva"
      className={`site-brand${inverse ? ' site-brand-inverse' : ''}`}
      href="/"
    >
      <span aria-hidden="true" className="site-brand-symbol">
        <SiteIcon name="flame" />
      </span>
      {compact ? null : (
        <span className="site-brand-wordmark">
          <span>
            Brasa Viva<span className="site-brand-dot">.</span>
          </span>
          <span className="site-brand-city">COCHABAMBA</span>
        </span>
      )}
    </Link>
  );
}
