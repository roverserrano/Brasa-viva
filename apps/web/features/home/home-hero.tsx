import Image from 'next/image';
import { PublicLink } from '../../components/site/public-link';
import { SiteIcon } from '../../components/site/site-icon';

export function HomeHero() {
  return (
    <>
      <section className="home-hero home-hero-refined" aria-labelledby="home-title">
        <Image
          alt="Pollo dorado al fuego con papas y llajua, presentación ilustrativa"
          className="home-hero-image"
          fill
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          src="/images/brasa-viva-fire-v2.webp"
        />
        <div className="home-hero-shade" />
        <div className="home-hero-content">
          <p className="public-eyebrow">
            <span className="home-live-dot" /> DE COCHABAMBA, CON MUCHO SABOR
          </p>
          <h1 id="home-title" className="public-display">
            El fuego se siente.
            <br />
            El sabor
            <br />
            <em>se comparte.</em>
          </h1>
          <p>
            Pollo doradito, broaster crujiente y sabores para compartir en Cochabamba. Elige tu
            sucursal, arma tu pedido y coordinamos por WhatsApp.
          </p>
          <div className="public-actions">
            <PublicLink className="public-button" href="/menu">
              Tengo un antojo <SiteIcon name="arrow" />
            </PublicLink>
            <a className="home-secondary-link" href="#antojos">
              Déjate tentar <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="home-hero-note">
            <SiteIcon name="check" />
            <span>Elige, confirma y coordina por WhatsApp. Sin crear una cuenta.</span>
          </div>
        </div>
        <div className="home-hero-seal" aria-hidden="true">
          <SiteIcon name="flame" />
          <span>
            BUENA COMIDA
            <br />
            BUENA COMPAÑÍA
          </span>
          <small>BRASA VIVA</small>
        </div>
        <div className="hero-photo-caption">
          <span>EL ANTOJO DEL DÍA</span>
          <strong>
            Bien doradito.
            <br />
            Como nos gusta.
          </strong>
          <small>Presentación ilustrativa</small>
        </div>
      </section>
      <div className="home-start-strip public-container">
        <div>
          <SiteIcon name="flame" />
          <span>
            <strong>Tu próximo buen plan.</strong>
            <small>Una sucursal, tus favoritos y ganas de disfrutar.</small>
          </span>
        </div>
        <PublicLink href="/sucursales">
          <SiteIcon name="pin" />
          <span>Encuentra tu sucursal</span>
          <SiteIcon name="arrow" />
        </PublicLink>
      </div>
    </>
  );
}
