import { PublicLink as Link } from '../../../components/site/public-link';
import Image from 'next/image';
import { PageIntro } from '../../../components/site/page-intro';
import { SiteIcon } from '../../../components/site/site-icon';
import { getPromotions } from '../../../lib/api';

export const metadata = {
  title: 'Promociones',
  description: 'Descubre promociones vigentes de Brasa Viva y consulta disponibilidad por sucursal.'
};

export default async function PromotionsPage() {
  const promotions = await getPromotions().catch(() => null);
  return (
    <main className="public-container public-page">
      <PageIntro
        image={{
          src: '/images/brasa-viva-sharing-v1.webp',
          alt: 'Mesa con pollo y acompañamientos para compartir, imagen ilustrativa'
        }}
        eyebrow="UN BUEN PLAN PARA COMPARTIR"
        title={
          <>
            Más sabor.
            <br />
            <em>Más razones para juntarnos.</em>
          </>
        }
        description="Descubre nuestras promociones vigentes. Elige tu sucursal para comprobar qué opciones están disponibles."
      />
      <section className="public-card-grid" aria-label="Promociones vigentes">
        {promotions?.map((promotion) => (
          <article className="public-promo-card" key={promotion.id}>
            <p className="public-eyebrow">PROMOCIÓN VIGENTE</p>
            <h2>{promotion.name}</h2>
            {promotion.description ? <p>{promotion.description}</p> : null}
            {promotion.promoPrice ? (
              <strong className="public-promo-value">Bs {promotion.promoPrice}</strong>
            ) : promotion.discountPercent ? (
              <strong className="public-promo-value">
                {promotion.discountPercent.replace(/\.00$/, '')}% de descuento
              </strong>
            ) : promotion.discountAmount ? (
              <strong className="public-promo-value">
                Bs {promotion.discountAmount} de descuento
              </strong>
            ) : null}
            <small>
              Hasta el{' '}
              {new Intl.DateTimeFormat('es-BO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'America/La_Paz'
              }).format(new Date(promotion.endsAt))}
              . Sujeta a disponibilidad por sucursal.
            </small>
            <Link className="public-text-link" href="/menu">
              Consultar en el menú <SiteIcon name="arrow" />
            </Link>
          </article>
        ))}
      </section>
      {!promotions || promotions.length === 0 ? (
        <div className="public-empty" role={!promotions ? 'alert' : undefined}>
          <SiteIcon name="flame" />
          <h2>
            {promotions
              ? 'Los antojos siguen. Las promociones vuelven pronto.'
              : 'No pudimos cargar las promociones.'}
          </h2>
          <p>
            {promotions
              ? 'Mientras preparamos las próximas, descubre el menú de tu sucursal y arma tu pedido.'
              : 'Intenta nuevamente en unos momentos. También puedes consultar el menú de tu sucursal.'}
          </p>
          <div className="public-actions">
            <Link className="public-button" href="/menu">
              Descubrir el menú <SiteIcon name="arrow" />
            </Link>
            {!promotions ? (
              <Link className="public-text-link" href="/promociones">
                Volver a cargar
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
      <section className="public-editorial public-section">
        <div className="public-editorial-image">
          <Image
            src="/images/brasa-viva-hero.webp"
            alt="Presentación ilustrativa de pollo broaster, spiedo y papas para compartir"
            fill
            sizes="(max-width: 767px) 90vw, 45vw"
          />
        </div>
        <div className="public-editorial-copy">
          <p className="public-eyebrow">MEJOR CUANDO NOS REUNIMOS</p>
          <h2>
            La mesa está mejor
            <br />
            con buena compañía.
          </h2>
          <p>
            Ya sea para una comida en familia o una pausa con amigos, el primer paso es elegir tu
            sucursal. Nosotros ponemos el sabor.
          </p>
          <Link className="public-text-link" href="/sucursales">
            Elegir sucursal <SiteIcon name="arrow" />
          </Link>
        </div>
      </section>
    </main>
  );
}
