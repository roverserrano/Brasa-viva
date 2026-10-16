'use client';
import Link from 'next/link';
import { useRef, useState, type ReactNode } from 'react';
import type { AdminMeResponse } from '@brasa-viva/contracts';
import { AdminIcon, type AdminIconName } from './admin-icon';
import { roleLabels } from './admin-labels';

const routeIcons: Record<string, AdminIconName> = {
  '/admin': 'dashboard',
  '/admin/productos': 'products',
  '/admin/categorias': 'categories',
  '/admin/sucursales': 'branches',
  '/admin/promociones': 'promotions',
  '/admin/pedidos': 'orders',
  '/admin/usuarios': 'users',
  '/admin/configuracion': 'settings'
};
export function AdminFrame({
  session,
  pathname,
  navigation,
  onSignOut,
  children
}: {
  session: AdminMeResponse;
  pathname: string;
  navigation: { href: string; label: string }[];
  onSignOut: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const page = navigation.find((item) => item.href === pathname)?.label ?? 'Administración';
  return (
    <div className="admin-shell executive-shell">
      <aside
        className="admin-sidebar"
        aria-label="Navegación administrativa"
        data-open={open}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && open) {
            setOpen(false);
            toggle.current?.focus();
          }
        }}
      >
        <Link
          href={navigation[0]?.href ?? '/admin'}
          className="admin-brand"
          onClick={() => setOpen(false)}
        >
          <span aria-hidden="true">
            BV<span className="brand-dot">.</span>
          </span>
          <strong>Brasa Viva</strong>
          <small>BUSINESS CENTER</small>
        </Link>
        <button
          ref={toggle}
          className="admin-nav-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="admin-navigation"
          aria-label={open ? 'Cerrar navegación administrativa' : 'Abrir navegación administrativa'}
          onClick={() => setOpen(!open)}
        >
          <AdminIcon name={open ? 'close' : 'menu'} />
        </button>
        <div className="admin-sidebar-content" id="admin-navigation">
          <p className="admin-nav-caption">ESPACIO DE TRABAJO</p>
          <nav aria-label="Secciones administrativas">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={pathname === item.href ? 'page' : undefined}
                className={`admin-nav-link ${pathname === item.href ? 'admin-nav-link-active' : ''}`}
              >
                <AdminIcon name={routeIcons[item.href] ?? 'dashboard'} />
                <span>{item.label}</span>
                {pathname === item.href ? <span className="admin-active-dot" /> : null}
              </Link>
            ))}
          </nav>
          <div className="admin-sidebar-note">
            <span>Tu negocio, en perspectiva.</span>
            <p>Información clara para decidir el siguiente paso.</p>
            <Link href="/" target="_blank" rel="noreferrer">
              Ver sitio público <AdminIcon name="external" />
            </Link>
          </div>
          <div className="admin-sidebar-footer">
            <div className="admin-profile">
              <span className="admin-avatar" aria-hidden="true">
                {session.fullName.trim().slice(0, 1).toUpperCase()}
              </span>
              <div>
                <p>{session.fullName}</p>
                <small>{session.roles.map((role) => roleLabels[role]).join(' · ')}</small>
              </div>
            </div>
            <button type="button" className="admin-link-button" onClick={onSignOut}>
              <AdminIcon name="logout" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <span>Administración</span>
            <span aria-hidden="true">/</span>
            <strong>{page}</strong>
          </div>
          <span className="admin-access-chip">
            <span />
            Acceso autorizado
          </span>
        </header>
        <main className="admin-main" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
