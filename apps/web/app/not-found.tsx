import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main className="system-page">
      <section className="system-card">
        <p className="system-eyebrow">Página no encontrada</p>
        <h1>Esta página no está disponible</h1>
        <p>
          El producto o enlace puede haber cambiado. En el menú encontrarás lo que ofrecemos en cada
          sucursal.
        </p>
        <div className="system-actions">
          <Link className="system-button" href="/menu">
            Explorar el menú
          </Link>
          <Link className="system-button-secondary" href="/">
            Ir al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
