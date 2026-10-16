import { PublicLink as Link } from '../../../../components/site/public-link';
import { getBranchDetail } from '../../../../lib/api';
import { formatBusinessTime } from '../../../../lib/business-hours';
import { PageIntro } from '../../../../components/site/page-intro';
import { SiteIcon } from '../../../../components/site/site-icon';

export const metadata = { title: 'Sucursal' };
const serviceLabels = {
  PICKUP: 'Recojo en sucursal',
  DELIVERY: 'Delivery coordinado',
  DINE_IN: 'Consumo en local',
  QR_PAYMENT: 'Pago QR'
} as const;
const weekdayLabels = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
type BranchPageProps = { params: Promise<{ slug: string }> };

export default async function BranchPage({ params }: BranchPageProps) {
  const { slug } = await params;
  const branch = await getBranchDetail(slug).catch(() => null);
  if (!branch)
    return (
      <main className="public-container public-page">
        <PageIntro
          eyebrow="BUSQUEMOS TU SUCURSAL"
          title={
            <>
              Todavía no pudimos
              <br />
              <em>encontrarla.</em>
            </>
          }
          description="La sucursal no está disponible o no pudimos conectar. Consulta otras sucursales o vuelve a intentarlo."
        />
        <Link className="public-button" href="/sucursales">
          Ver sucursales <SiteIcon name="arrow" />
        </Link>
      </main>
    );
  const phone = branch.phone?.replace(/[^+0-9]/g, '');
  const whatsapp = branch.whatsapp?.replace(/[^0-9]/g, '');
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${branch.address}, ${branch.city}, Bolivia`)}`;
  return (
    <main className="public-container public-page">
      <PageIntro
        eyebrow="TU PUNTO DE ENCUENTRO"
        title={branch.name}
        description={`${branch.address}, ${branch.city}`}
      />
      <div className="public-actions">
        <Link className="public-button" href={`/menu?branch=${encodeURIComponent(branch.slug)}`}>
          Ver menú y pedir <SiteIcon name="arrow" />
        </Link>
        <a className="public-text-link" href={mapsUrl} target="_blank" rel="noopener noreferrer">
          Buscar dirección en Maps <SiteIcon name="pin" />
          <span className="sr-only"> (abre una nueva pestaña)</span>
        </a>
      </div>
      <section className="public-detail-panels">
        <div className="public-detail-panel">
          <h2>
            <SiteIcon name="bag" /> Servicios disponibles
          </h2>
          {branch.services.length ? (
            <ul>
              {branch.services.map((service) => (
                <li key={service}>
                  {serviceLabels[service]} <SiteIcon name="check" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="public-intro-copy">
              Consulta los servicios al comunicarte con la sucursal.
            </p>
          )}
        </div>
        <div className="public-detail-panel">
          <h2>
            <SiteIcon name="clock" /> Horarios de atención
          </h2>
          {branch.businessHours.length ? (
            <ul>
              {[...branch.businessHours]
                .sort((a, b) => ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7))
                .map((hour) => (
                  <li key={hour.weekday}>
                    <span>{weekdayLabels[hour.weekday]}</span>
                    <span>
                      {hour.isClosed
                        ? 'Cerrado'
                        : hour.opensAt && hour.closesAt
                          ? `${formatBusinessTime(hour.opensAt)} – ${formatBusinessTime(hour.closesAt)}`
                          : 'Consultar horario'}
                    </span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="public-intro-copy">
              Consulta el horario actualizado al comunicarte con la sucursal.
            </p>
          )}
        </div>
      </section>
      <section className="public-contact-panel">
        <p className="public-eyebrow">¿ALGUNA CONSULTA?</p>
        <h2>Hablemos con la sucursal.</h2>
        <p>
          Para consultar horarios o servicios, usa sus datos de contacto. Para pedir, empieza por el
          menú y recibe tu código de pedido antes de continuar por WhatsApp.
        </p>
        <div className="public-actions">
          {phone && /^\+?\d{7,15}$/.test(phone) ? (
            <a className="public-button public-button-outline" href={`tel:${phone}`}>
              <SiteIcon name="phone" /> Llamar: {branch.phone}
            </a>
          ) : null}
          {whatsapp && /^\d{10,15}$/.test(whatsapp) ? (
            <a
              className="public-button public-button-outline"
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hola, quisiera consultar los horarios y servicios de ${branch.name}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <SiteIcon name="chat" /> Consultar por WhatsApp
              <span className="sr-only"> (abre una nueva pestaña)</span>
            </a>
          ) : null}
          {!phone && !whatsapp ? (
            <p>Los datos de contacto estarán disponibles próximamente.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
