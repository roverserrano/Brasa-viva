import Image from 'next/image';
import { PublicLink } from '../../components/site/public-link';
import { SiteIcon } from '../../components/site/site-icon';
import { menuHref } from '../../lib/menu-navigation';

const highlights = [
  {
    title: 'Crujiente. Irresistible.',
    name: 'Broaster',
    copy: 'El primer bocado lo dice todo.',
    image: '/images/brasa-viva-broaster-v1.webp',
    href: menuHref({ q: 'broaster' }),
    number: '01',
    size: '(max-width: 767px) 95vw, 55vw'
  },
  {
    title: 'Dorado a fuego lento.',
    name: 'Spiedo',
    copy: 'Para los que saben disfrutar.',
    image: '/images/brasa-viva-fire-v2.webp',
    href: menuHref({ q: 'spiedo' }),
    number: '02',
    size: '(max-width: 767px) 95vw, 40vw'
  },
  {
    title: 'Una mesa. Mil ganas.',
    name: 'Para compartir',
    copy: 'Invita a tu gente. El sabor lo ponemos nosotros.',
    image: '/images/brasa-viva-sharing-v1.webp',
    href: '/menu',
    number: '03',
    size: '(max-width: 767px) 95vw, 40vw'
  }
];

export function FoodDiscovery() {
  return (
    <section
      className="public-container public-section food-discovery"
      id="antojos"
      aria-labelledby="favorites-title"
    >
      <div className="public-section-heading">
        <div>
          <p className="public-eyebrow">SE MIRA. SE ANTOJA. SE DISFRUTA.</p>
          <h2 id="favorites-title" className="public-display">
            ¿Y si hoy te das
            <br />
            <em>ese gusto?</em>
          </h2>
        </div>
        <div>
          <p>
            Encuentra ese sabor que ya estás imaginando.
            <br />
            La parte difícil es elegir solo uno.
          </p>
          <PublicLink className="public-text-link" href="/menu">
            Todo el menú <SiteIcon name="arrow" />
          </PublicLink>
        </div>
      </div>
      <div className="signature-grid">
        {highlights.map((item) => (
          <PublicLink className="signature-card" href={item.href} key={item.number}>
            <Image src={item.image} alt="" fill sizes={item.size} />
            <span className="signature-tag">
              <span>{item.number}</span>
              {item.name}
            </span>
            <div className="signature-card-copy">
              <div>
                <h3 className="public-display">{item.title}</h3>
                <p>{item.copy}</p>
              </div>
              <span className="public-round-arrow">
                <SiteIcon name="arrow" />
              </span>
            </div>
          </PublicLink>
        ))}
      </div>
      <p className="public-image-note">
        Fotografías ilustrativas. Consulta porciones, precios y disponibilidad en el menú de tu
        sucursal.
      </p>
    </section>
  );
}
