import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function PageIntro({
  eyebrow,
  title,
  description,
  children,
  image
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  children?: ReactNode;
  image?: { src: string; alt: string };
}) {
  return (
    <header className={`public-page-intro${image ? ' with-visual' : ''}`}>
      <div>
        <Link className="public-breadcrumb" href="/">
          Inicio <span aria-hidden="true">/</span>
        </Link>
        <p className="public-eyebrow">{eyebrow}</p>
        <h1 className="public-display">{title}</h1>
        <p className="public-intro-copy">{description}</p>
        {children}
      </div>
      {image ? (
        <figure className="page-intro-visual">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="(max-width: 767px) 1px, 40vw"
          />
          <figcaption>Imagen ilustrativa</figcaption>
        </figure>
      ) : null}
    </header>
  );
}
