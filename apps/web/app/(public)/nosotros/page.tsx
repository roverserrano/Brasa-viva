import { PublicLink as Link } from '../../../components/site/public-link';
import Image from 'next/image';
import { PageIntro } from '../../../components/site/page-intro';
import { SiteIcon } from '../../../components/site/site-icon';

export const metadata = {
  title: 'Nosotros',
  description: 'Conoce Brasa Viva: pollo broaster, spiedo y momentos para compartir en Cochabamba.'
};

export default function AboutPage() {
  return (
    <main className="public-container public-page">
      <PageIntro
        image={{
          src: '/images/brasa-viva-fire-v2.webp',
          alt: 'Pollo dorado al fuego con papas, imagen ilustrativa'
        }}
        eyebrow="ASÍ SABE BRASA VIVA"
        title={
          <>
            La comida reúne.
            <br />
            <em>El sabor nos hace volver.</em>
          </>
        }
        description="Hay planes que no necesitan mucho: una mesa, buena compañía y algo rico para compartir. Ese es el espíritu de Brasa Viva."
      />
      <section className="public-editorial">
        <div className="public-editorial-image">
          <Image
            src="/images/brasa-viva-fire-v2.webp"
            alt="Pollo dorado al fuego, papas y llajua, imagen ilustrativa de la propuesta gastronómica"
            fill
            loading="eager"
            sizes="(max-width: 767px) 90vw, 45vw"
          />
        </div>
        <div className="public-editorial-copy">
          <p className="public-eyebrow">SABORES PARA DISFRUTAR</p>
          <h2>
            Un antojo sencillo.
            <br />
            Un momento especial.
          </h2>
          <p>
            Broaster crujiente, spiedo doradito y opciones para compartir. Nuestra propuesta
            acompaña esa pausa del mediodía, una reunión espontánea o las ganas de comer algo rico.
          </p>
          <p>
            Estamos en Cochabamba. Descubre el menú de cada sucursal y elige dónde disfrutar tu
            próximo pedido.
          </p>
          <Link className="public-button" href="/menu">
            Conocer el menú <SiteIcon name="arrow" />
          </Link>
        </div>
      </section>
      <section className="public-editorial">
        <div className="public-editorial-copy">
          <p className="public-eyebrow">DE LA PANTALLA A TU MESA</p>
          <h2>
            Elegir fácil.
            <br />
            Compartir mejor.
          </h2>
          <p>
            Queremos que pedir sea sencillo. Aquí encuentras sucursales, opciones y precios;
            registras tu pedido y continúas por WhatsApp con el equipo que te atenderá.
          </p>
          <Link className="public-text-link" href="/sucursales">
            Encuentra tu sucursal <SiteIcon name="pin" />
          </Link>
        </div>
        <div className="public-editorial-image">
          <Image
            src="/images/brasa-viva-atmosphere-v1.webp"
            alt="Ambiente ilustrativo de un restaurante cálido con mesas listas para compartir"
            fill
            sizes="(max-width: 767px) 90vw, 45vw"
          />
          <span>Concepto de ambiente · imagen ilustrativa</span>
        </div>
      </section>
    </main>
  );
}
