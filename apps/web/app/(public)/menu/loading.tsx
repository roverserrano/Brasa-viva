export default function MenuLoading() {
  return (
    <main className="public-container public-page">
      <div role="status" aria-live="polite">
        <p className="public-eyebrow">Preparando tu pedido</p>
        <h1 className="public-display">Cargando el menú…</h1>
        <p className="public-intro-copy">
          Estamos buscando las sucursales y los productos disponibles.
        </p>
      </div>
      <div className="skeleton-grid" aria-hidden="true">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
    </main>
  );
}
