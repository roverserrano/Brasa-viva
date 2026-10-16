import { getBranches } from '../../lib/api';
import { menuHref } from '../../lib/menu-navigation';
import { PublicLink } from '../../components/site/public-link';
import { SiteIcon } from '../../components/site/site-icon';

export async function HomeBranches() {
  const branches = await getBranches().catch(() => []);
  return (
    <section
      className="home-branch-section public-container public-section"
      aria-labelledby="home-branches-title"
    >
      <div className="home-branch-heading">
        <div>
          <p className="public-eyebrow">EL BUEN PLAN EMPIEZA CERCA</p>
          <h2 className="public-display" id="home-branches-title">
            Tu mesa. Tu casa.
            <br />
            <em>Tu Brasa Viva.</em>
          </h2>
        </div>
        <p>
          Elige desde dónde pedir. Te mostramos el menú y los precios de esa sucursal, para que
          disfrutes a tu manera.
        </p>
      </div>
      {branches.length ? (
        <div className="home-branch-grid">
          {branches.slice(0, 3).map((branch, index) => (
            <article className="home-branch-card" key={branch.id}>
              <div className="home-branch-top">
                <SiteIcon name="pin" />
                <span aria-hidden="true">0{index + 1}</span>
              </div>
              <h3>{branch.name}</h3>
              <p>{branch.address}</p>
              <PublicLink
                className="public-text-link"
                href={menuHref({ branch: branch.slug })}
                aria-label={`Ver menú de ${branch.name}`}
              >
                Ver menú y pedir <SiteIcon name="arrow" />
              </PublicLink>
            </article>
          ))}
        </div>
      ) : (
        <p className="home-branch-fallback">
          Consulta nuestras sucursales y elige la que prefieras para tu próximo pedido.
        </p>
      )}
      <PublicLink className="public-text-link home-branches-all" href="/sucursales">
        Explorar todas las sucursales <SiteIcon name="arrow" />
      </PublicLink>
    </section>
  );
}
