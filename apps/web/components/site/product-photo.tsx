'use client';

import Image from 'next/image';
import { useState } from 'react';
import { resolveCatalogImage } from '../../lib/catalog-image';
import { SiteIcon } from './site-icon';

export function ProductPhoto({
  imageUrl,
  name,
  featured = false,
  priority = false,
  sizes = '(max-width: 479px) 90vw, (max-width: 1023px) 45vw, 30vw'
}: {
  imageUrl: string | null;
  name: string;
  featured?: boolean;
  priority?: boolean;
  sizes?: string;
}) {
  const source = resolveCatalogImage(imageUrl);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return (
    <div className="product-photo">
      {source && source !== failedSource ? (
        <Image
          src={source}
          alt={name}
          fill
          sizes={sizes}
          priority={priority}
          onError={() => setFailedSource(source)}
        />
      ) : (
        <div className="product-photo-placeholder">
          <SiteIcon name="photo" />
          <span>Foto próximamente</span>
        </div>
      )}
      {featured ? <span className="product-photo-label">DESTACADO DEL MENÚ</span> : null}
    </div>
  );
}
