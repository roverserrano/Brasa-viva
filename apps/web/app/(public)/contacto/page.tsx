import { PublicLink as Link } from '../../../components/site/public-link';
import { PageIntro } from '../../../components/site/page-intro';
import { SiteIcon } from '../../../components/site/site-icon';

export const metadata = {
  title: 'Contacto',
  description: 'Contacta a tu sucursal Brasa Viva en Cochabamba y consulta cómo realizar tu pedido.'
};

export default function ContactPage() {
  return (
    <main className="public-container public-page">
      <PageIntro
        image={{
          src: '/images/brasa-viva-sharing-v1.webp',
          alt: 'Una mesa para compartir, imagen ilustrativa'
        }}
        eyebrow="NOS GUSTA SABER DE TI"
        title={
          <>
            Hablemos de tu
            <br />
            <em>próximo pedido.</em>
          </>
        }
        description="Encuentra los datos de contacto de tu sucursal para consultar horarios, servicios o coordinar la atención."
      />
      <div className="public-card-grid">
        <section className="public-contact-panel">
          <SiteIcon name="pin" />
          <h2>Encuentra a tu equipo.</h2>
          <p>
            Cada sucursal tiene sus datos de contacto. Selecciona la que te queda mejor y consulta
            sus teléfonos y horarios.
          </p>
          <Link className="public-button" href="/sucursales">
            Ver sucursales <SiteIcon name="arrow" />
          </Link>
        </section>
        <section className="public-contact-panel">
          <SiteIcon name="bag" />
          <h2>¿Ya se te antojó?</h2>
          <p>
            Arma tu pedido en el menú. Primero lo registramos y confirmamos el total; después
            continúas con la sucursal por WhatsApp.
          </p>
          <Link className="public-button public-button-outline" href="/menu">
            Empezar mi pedido <SiteIcon name="arrow" />
          </Link>
        </section>
      </div>
    </main>
  );
}
