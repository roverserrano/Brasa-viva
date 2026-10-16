import Image from 'next/image';
import { PublicLink } from '../../components/site/public-link';
import { SiteIcon } from '../../components/site/site-icon';

export function HomePromotion() {
  return (
    <section className="home-sharing public-container" aria-labelledby="sharing-title">
      <div className="home-sharing-photo">
        <Image
          src="/images/brasa-viva-sharing-v1.webp"
          alt="Mesa para compartir pollo, papas y llajua; imagen ilustrativa"
          fill
          sizes="(max-width: 767px) 95vw, 50vw"
        />
      </div>
      <div className="home-sharing-copy">
        <p className="public-eyebrow">EL PLAN ES JUNTARNOS</p>
        <h2 id="sharing-title" className="public-display">
          Los mejores
          <br />
          momentos vienen
          <br />
          <em>bien acompañados.</em>
        </h2>
        <p>
          Una comida en familia, una pausa con amigos, un antojo compartido. Descubre las
          promociones vigentes y arma tu plan.
        </p>
        <PublicLink className="public-button public-button-light" href="/promociones">
          Encontrar mi promoción <SiteIcon name="arrow" />
        </PublicLink>
        <span className="home-sharing-scribble" aria-hidden="true">
          Hoy invitas tú.
        </span>
      </div>
    </section>
  );
}

export function HomeExperience() {
  return (
    <section className="home-experience" aria-labelledby="experience-title">
      <div className="public-container experience-grid">
        <div className="experience-collage">
          <div className="experience-main-photo">
            <Image
              src="/images/brasa-viva-atmosphere-v1.webp"
              alt="Concepto ilustrativo de un ambiente cálido, con mesas de madera y luz natural"
              fill
              sizes="(max-width: 767px) 90vw, 45vw"
            />
          </div>
          <div className="experience-detail-photo">
            <Image
              src="/images/brasa-viva-broaster-v1.webp"
              alt="Presentación ilustrativa de broaster con papas y llajua"
              fill
              sizes="(max-width: 767px) 45vw, 23vw"
            />
          </div>
          <span className="experience-caption">Ambiente conceptual · imágenes ilustrativas</span>
        </div>
        <div className="home-atmosphere-copy">
          <p className="public-eyebrow">MÁS QUE UNA COMIDA</p>
          <h2 id="experience-title" className="public-display">
            Ese lugar
            <br />
            al que dan ganas
            <br />
            <em>de volver.</em>
          </h2>
          <p>
            Para una charla larga, una comida sin apuro o llevarte tu favorito a casa. Encuentra tu
            sucursal en Cochabamba y consulta sus servicios y horarios.
          </p>
          <PublicLink className="public-button" href="/sucursales">
            Aquí nos encontramos <SiteIcon name="pin" />
          </PublicLink>
          <PublicLink className="public-text-link" href="/nosotros">
            Esto es Brasa Viva <SiteIcon name="arrow" />
          </PublicLink>
        </div>
      </div>
    </section>
  );
}
