import { PublicLink as Link } from '../../../components/site/public-link';
import Image from 'next/image';
import { getBranches } from '../../../lib/api';
import { PageIntro } from '../../../components/site/page-intro';
import { SiteIcon } from '../../../components/site/site-icon';

export const metadata = {
  title: 'Sucursales',
  description:
    'Encuentra Brasa Viva en Cochabamba. Consulta direcciones, horarios y menú por sucursal.'
};

export default async function BranchesPage() {
  const branches = await getBranches().catch(() => null);
  return (
    <main className="public-container public-page">
      <PageIntro
        image={{
          src: '/images/brasa-viva-atmosphere-v1.webp',
          alt: 'Ambiente conceptual de restaurante, no representa una sucursal real'
        }}
        eyebrow="CERCA DE TU PRÓXIMO ANTOJO"
        title={
          <>
            Nos encontramos
            <br />
            <em>en Cochabamba.</em>
          </>
        }
        description="Elige tu sucursal. Consulta su dirección, horarios y servicios, o ve directo a su menú para empezar tu pedido."
      />
      <section className="public-card-grid" aria-label="Sucursales disponibles">
        {branches?.map((branch, index) => (
          <article className="public-branch-card" key={branch.id}>
            <SiteIcon name="pin" />
            <span className="public-card-index" aria-hidden="true">
              0{index + 1}
            </span>
            <h2>{branch.name}</h2>
            <p>{branch.address}</p>
            <div className="public-actions">
              <Link
                className="public-button"
                href={`/menu?branch=${encodeURIComponent(branch.slug)}`}
              >
                Ver menú <SiteIcon name="arrow" />
              </Link>
              <Link
                className="public-text-link"
                href={`/sucursales/${encodeURIComponent(branch.slug)}`}
              >
                Horarios y servicios
              </Link>
            </div>
          </article>
        ))}
      </section>
      {!branches || branches.length === 0 ? (
        <div className="public-empty" role={!branches ? 'alert' : undefined}>
          <SiteIcon name="pin" />
          <h2>
            {branches
              ? 'Estamos actualizando nuestras sucursales.'
              : 'No pudimos cargar las sucursales.'}
          </h2>
          <p>
            Vuelve a consultar en unos momentos para encontrar la dirección y el menú de tu
            sucursal.
          </p>
          <Link className="public-button" href="/sucursales">
            Volver a cargar <SiteIcon name="arrow" />
          </Link>
        </div>
      ) : null}
      <section className="public-editorial public-section">
        <div className="public-editorial-image">
          <Image
            src="/images/brasa-viva-atmosphere-v1.webp"
            alt="Concepto ilustrativo de restaurante con luz cálida, mesas de madera y plantas; no es una sucursal real"
            fill
            loading="eager"
            sizes="(max-width: 767px) 90vw, 45vw"
          />
          <span>Concepto de ambiente · imagen ilustrativa</span>
        </div>
        <div className="public-editorial-copy">
          <p className="public-eyebrow">PARA LLEVAR O QUEDARTE</p>
          <h2>
            Tu comida.
            <br />
            Tu manera de disfrutarla.
          </h2>
          <p>
            Consulta los servicios de cada sucursal antes de visitarnos. Para recojo o delivery,
            registra tu pedido y coordina los detalles por WhatsApp.
          </p>
          <Link className="public-text-link" href="/menu">
            Armar mi pedido <SiteIcon name="arrow" />
          </Link>
        </div>
      </section>
    </main>
  );
}
