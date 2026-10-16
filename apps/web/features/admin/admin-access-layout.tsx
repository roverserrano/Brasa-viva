import type { ReactNode } from 'react';

/** Marco de la pantalla de acceso administrativo, alineado al workspace executive. */
export function AdminAccessLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main id="main-content" tabIndex={-1} className="admin-access">
      <aside className="admin-access-brand">
        <p className="admin-access-wordmark">
          <span aria-hidden="true">
            BV<span className="admin-access-dot">.</span>
          </span>
          <span>
            <strong>Brasa Viva</strong>
            <small>BUSINESS CENTER</small>
          </span>
        </p>
        <div className="admin-access-story">
          <p className="admin-access-tagline">El centro de operaciones de tu cadena.</p>
          <p>Menú, precios por sucursal, pedidos y equipo en un mismo espacio de trabajo.</p>
          <ul>
            <li>Catálogo y disponibilidad por sucursal</li>
            <li>Pedidos con estados y seguimiento</li>
            <li>Roles según responsabilidad</li>
          </ul>
        </div>
        <p className="admin-access-note">Acceso restringido · Solo cuentas autorizadas</p>
      </aside>
      <section className="admin-access-panel">
        <div className="admin-access-card">{children}</div>
      </section>
    </main>
  );
}
