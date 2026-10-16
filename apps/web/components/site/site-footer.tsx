import { PublicLink as Link } from './public-link';
import { BrandMark } from './brand-mark';
import { SiteIcon } from './site-icon';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="public-container site-footer-top">
        <div>
          <p className="public-eyebrow">EL PRÓXIMO BUEN MOMENTO</p>
          <h2 className="public-display">
            Empieza con <em>un antojo.</em>
          </h2>
        </div>
        <Link className="public-button public-button-light" href="/menu">
          Vamos al menú <SiteIcon name="arrow" />
        </Link>
      </div>
      <div className="public-container site-footer-grid">
        <div>
          <BrandMark inverse />
          <p>
            Pollo, buena compañía y ese sabor que te hace volver. Nos encontramos en Cochabamba.
          </p>
        </div>
        <nav aria-label="Explorar Brasa Viva">
          <h3>Por aquí se empieza</h3>
          <Link href="/menu">Nuestro menú</Link>
          <Link href="/promociones">Promociones</Link>
          <Link href="/sucursales">Encuentra tu sucursal</Link>
        </nav>
        <nav aria-label="Información de Brasa Viva">
          <h3>Hablemos</h3>
          <Link href="/nosotros">Conoce Brasa Viva</Link>
          <Link href="/contacto">Contacto y atención</Link>
          <Link href="/carrito">Revisar mi carrito</Link>
        </nav>
      </div>
      <div className="public-container site-footer-bottom">
        <span>© {new Date().getFullYear()} Brasa Viva · Cochabamba, Bolivia</span>
        <span>Imágenes de presentación ilustrativas.</span>
      </div>
    </footer>
  );
}
