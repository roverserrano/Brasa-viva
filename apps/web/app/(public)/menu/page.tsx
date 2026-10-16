import { BranchPicker } from '../../../features/menu/branch-picker';
import { PublicLink as Link } from '../../../components/site/public-link';
import type {
  BranchListResponse,
  CatalogResponse,
  CategoryListResponse
} from '@brasa-viva/contracts';
import { MenuCatalog } from '../../../features/menu/menu-catalog';
import { PageIntro } from '../../../components/site/page-intro';
import { SiteIcon } from '../../../components/site/site-icon';
import { getBranchMenu, getBranches, getCategories } from '../../../lib/api';
import { menuHref, readMenuContext } from '../../../lib/menu-navigation';

export const metadata = {
  title: 'Menú',
  description: 'Elige tu sucursal de Brasa Viva, descubre el menú y arma tu pedido en Cochabamba.'
};

type MenuPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function MenuPage({ searchParams }: MenuPageProps) {
  const context = readMenuContext(await searchParams);
  const { branch: selectedBranchSlug } = context;
  let branches: BranchListResponse = [];
  let categories: CategoryListResponse = [];
  let menu: CatalogResponse | null = null;
  let catalogError: string | null = null;
  {
    const [branchResult, categoryResult, menuResult] = await Promise.allSettled([
      getBranches(),
      getCategories(),
      selectedBranchSlug ? getBranchMenu(selectedBranchSlug) : Promise.resolve(null)
    ]);
    if (branchResult.status === 'fulfilled') branches = branchResult.value;
    if (categoryResult.status === 'fulfilled') categories = categoryResult.value;
    if (menuResult.status === 'fulfilled' && categoryResult.status === 'fulfilled')
      menu = menuResult.value;
    if ([branchResult, categoryResult, menuResult].some((result) => result.status === 'rejected')) {
      catalogError =
        'No pudimos cargar el menú completo. Intenta nuevamente en unos momentos o elige otra sucursal.';
    }
  }

  return (
    <main className="public-container public-page">
      <PageIntro
        image={{
          src: '/images/brasa-viva-broaster-v1.webp',
          alt: 'Broaster crujiente con papas y llajua, presentación ilustrativa'
        }}
        eyebrow="EL ANTOJO LO ELIGES TÚ"
        title={
          <>
            Tu próximo <em>favorito.</em>
          </>
        }
        description="Crujiente, doradito o para compartir. Elige una sucursal y descubre lo que tenemos para ti."
      >
        <ol className="public-order-trail" aria-label="Pasos para pedir">
          <li>
            <span>1</span> Elige sucursal
          </li>
          <li>
            <span>2</span> Añade tus favoritos
          </li>
          <li>
            <span>3</span> Confirma tu pedido
          </li>
        </ol>
      </PageIntro>
      {branches.length > 0 ? <BranchPicker branches={branches} /> : null}
      {catalogError ? (
        <div className="public-empty" role="alert">
          <SiteIcon name="chat" />
          <h2>Un momento, estamos intentando conectar.</h2>
          <p>{catalogError}</p>
          <Link className="public-button" href={menuHref(context)}>
            Volver a cargar el menú <SiteIcon name="arrow" />
          </Link>
        </div>
      ) : branches.length === 0 ? (
        <div className="public-empty">
          <SiteIcon name="flame" />
          <h2>Estamos preparando el menú.</h2>
          <p>Vuelve en unos minutos para consultar las sucursales y sus opciones.</p>
          <Link className="public-text-link" href="/contacto">
            Ver opciones de contacto <SiteIcon name="arrow" />
          </Link>
        </div>
      ) : null}
      {!menu && !catalogError && branches.length > 0 ? (
        <div className="public-empty">
          <SiteIcon name="bag" />
          <h2>Tu pedido empieza con una sucursal.</h2>
          <p>
            Selecciona una de las opciones de arriba. Después podrás ver precios y añadir tus
            favoritos al carrito, sin crear una cuenta.
          </p>
        </div>
      ) : null}
      {menu ? <MenuCatalog key={menuHref(context)} menu={menu} categories={categories} /> : null}
    </main>
  );
}
