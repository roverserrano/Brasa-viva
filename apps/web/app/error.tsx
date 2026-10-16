'use client';

import Link from 'next/link';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="system-page" role="alert">
      <section className="system-card">
        <p className="system-eyebrow">Algo salió mal</p>
        <h1>No pudimos abrir esta pantalla</h1>
        <p>
          Puede ser un problema temporal de conexión. Intenta nuevamente o vuelve al menú para
          continuar.
        </p>
        <div className="system-actions">
          <button className="system-button" type="button" onClick={reset}>
            Intentar nuevamente
          </button>
          <Link className="system-button-secondary" href="/menu">
            Ir al menú
          </Link>
        </div>
      </section>
    </main>
  );
}
