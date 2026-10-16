'use client';

import { useSearchParams } from 'next/navigation';
import type { CatalogResponse, CategoryListResponse } from '@brasa-viva/contracts';
import { SiteIcon } from '../../components/site/site-icon';
import { menuHref, readMenuContext, type MenuContext } from '../../lib/menu-navigation';
import { selectProducts } from './select-products';
import { ProductCard } from './product-card';

export function MenuCatalog({
  menu,
  categories
}: {
  menu: CatalogResponse;
  categories: CategoryListResponse;
}) {
  const search = useSearchParams();
  const context = readMenuContext(Object.fromEntries(search.entries()));
  const query = (search.get('q') ?? '').slice(0, 160);
  const selectedCategory = categories.some(
    (category) =>
      category.slug === context.category &&
      menu.products.some((product) => product.categoryId === category.id)
  )
    ? (context.category ?? '')
    : '';
  const navigationContext = {
    ...context,
    q: query,
    branch: menu.branch.slug,
    category: selectedCategory
  };
  const visible = selectProducts(menu.products, categories, navigationContext);
  function updateFilters(patch: Partial<MenuContext>) {
    // Next's native History integration updates searchParams without refetching the catalog.
    window.history.replaceState(null, '', menuHref({ ...navigationContext, ...patch }));
  }
  const availableCategories = categories.filter((category) =>
    menu.products.some((product) => product.categoryId === category.id)
  );
  return (
    <section className="menu-catalog" aria-labelledby="menu-branch-title">
      <div className="menu-catalog-heading">
        <div>
          <p className="public-eyebrow">PREPARA TU PEDIDO</p>
          <h2 id="menu-branch-title">Menú de {menu.branch.name}</h2>
        </div>
        <label className="menu-search">
          ¿Qué te gustaría comer?
          <span className="menu-search-field">
            <SiteIcon name="search" />
            <input
              type="search"
              placeholder="Busca pollo, hamburguesas, bebidas…"
              value={query}
              maxLength={160}
              onChange={(event) => updateFilters({ q: event.target.value })}
            />
          </span>
        </label>
      </div>
      <nav aria-label="Filtrar por categoría" className="menu-category-nav">
        <button
          type="button"
          aria-pressed={!selectedCategory}
          onClick={() => updateFilters({ category: '' })}
        >
          Todo el menú
        </button>
        {availableCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            aria-pressed={selectedCategory === category.slug}
            onClick={() => updateFilters({ category: category.slug })}
          >
            {category.name}
          </button>
        ))}
      </nav>
      <div className="menu-results-toolbar">
        <p className="menu-results-count" role="status">
          {visible.length} {visible.length === 1 ? 'producto disponible' : 'productos disponibles'}{' '}
          · El total se confirma al registrar tu pedido.
        </p>
        {query || selectedCategory || context.sort ? (
          <button
            className="public-text-link"
            type="button"
            onClick={() => updateFilters({ q: '', category: '', sort: undefined })}
          >
            Limpiar filtros
          </button>
        ) : null}
        <label className="menu-sort">
          Ordenar
          <select
            value={context.sort ?? ''}
            onChange={(event) =>
              updateFilters({ sort: readMenuContext({ sort: event.target.value }).sort })
            }
          >
            <option value="">Por categoría</option>
            <option value="price-asc">Precio: menor a mayor</option>
            <option value="price-desc">Precio: mayor a menor</option>
          </select>
        </label>
      </div>
      {context.sort && visible.length ? (
        <div className="menu-product-grid">
          {visible.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              branch={menu.branch}
              context={navigationContext}
            />
          ))}
        </div>
      ) : (
        availableCategories.map((category) => {
          const products = visible.filter((product) => product.categoryId === category.id);
          if (!products.length) return null;
          return (
            <section className="menu-group" key={category.id}>
              <h3>{category.name}</h3>
              <div className="menu-product-grid">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    branch={menu.branch}
                    context={navigationContext}
                  />
                ))}
              </div>
            </section>
          );
        })
      )}
      {!visible.length ? (
        <div className="public-empty">
          <SiteIcon name="search" />
          <h3>
            {menu.products.length
              ? 'No encontramos productos con esa búsqueda.'
              : 'Estamos preparando el menú de esta sucursal.'}
          </h3>
          {menu.products.length ? (
            <button
              className="public-button public-button-outline"
              onClick={() => {
                updateFilters({ q: '', category: '', sort: undefined });
              }}
              type="button"
            >
              Mostrar todo el menú
            </button>
          ) : (
            <p>Prueba con otra sucursal o vuelve más tarde.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
