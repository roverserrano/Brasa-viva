'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AdminMeResponse } from '@brasa-viva/contracts';
import { AdminApiError, getAdminMe } from '../../lib/admin-api';
import { AdminFrame } from './admin-frame';
import { clearSession, signOut } from '../../lib/supabase-auth';

const AdminSessionContext = createContext<AdminMeResponse | null>(null);

type NavigationItem = {
  href: string;
  label: string;
  allowed: (session: AdminMeResponse) => boolean;
};

const navigationItems: NavigationItem[] = [
  { href: '/admin', label: 'Resumen', allowed: canViewDashboard },
  { href: '/admin/productos', label: 'Productos', allowed: canViewCatalog },
  { href: '/admin/categorias', label: 'Categorías', allowed: canViewCatalog },
  { href: '/admin/sucursales', label: 'Sucursales', allowed: canManageBranches },
  { href: '/admin/promociones', label: 'Promociones', allowed: canManagePromotions },
  { href: '/admin/pedidos', label: 'Pedidos', allowed: canManageOrders },
  { href: '/admin/usuarios', label: 'Usuarios', allowed: isOwner },
  { href: '/admin/configuracion', label: 'Configuración', allowed: canManageSettings }
];

export function AdminShell({ children }: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AdminMeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let current = true;
    setError(null);
    getAdminMe()
      .then((nextSession) => {
        if (current) {
          setSession(nextSession);
          if (pathname === '/admin' && !canViewDashboard(nextSession)) {
            router.replace('/admin/productos');
          }
        }
      })
      .catch((reason: unknown) => {
        if (!current) return;
        if (reason instanceof AdminApiError && reason.status === 401) {
          clearSession();
          router.replace(`/admin/login?next=${encodeURIComponent(pathname || '/admin')}`);
        } else {
          setError(
            reason instanceof Error
              ? reason.message
              : 'No pudimos comprobar tu acceso. Intenta nuevamente.'
          );
        }
      });

    return () => {
      current = false;
    };
  }, [pathname, router, retry]);

  async function handleSignOut(): Promise<void> {
    setError(null);
    try {
      await signOut();
    } catch {
      setError('No fue posible cerrar la sesión remota, pero el acceso local se cerró.');
    }
    router.replace('/admin/login');
  }

  if (error)
    return (
      <main className="admin-loading">
        <section className="admin-login-card">
          <h1>No pudimos abrir el panel</h1>
          <p role="alert">{error}</p>
          <div className="admin-action-row">
            <button
              className="admin-primary-button"
              type="button"
              onClick={() => setRetry((value) => value + 1)}
            >
              Intentar nuevamente
            </button>
            <button className="admin-secondary-button" type="button" onClick={handleSignOut}>
              Volver al ingreso
            </button>
          </div>
        </section>
      </main>
    );
  if (!session) {
    return <main className="admin-loading">Verificando acceso administrativo…</main>;
  }
  const page = navigationItems.find((item) => item.href === pathname);
  const allowed = !page || page.allowed(session);

  return (
    <AdminSessionContext.Provider value={session}>
      <AdminFrame
        session={session}
        pathname={pathname}
        navigation={navigationItems.filter((item) => item.allowed(session))}
        onSignOut={handleSignOut}
      >
        {allowed ? (
          children
        ) : (
          <section className="admin-panel">
            <h1>Esta sección no está habilitada para tu cuenta</h1>
            <p>Elige una de las opciones disponibles en el menú administrativo.</p>
          </section>
        )}
      </AdminFrame>
    </AdminSessionContext.Provider>
  );
}

export function useAdminSession(): AdminMeResponse {
  const session = useContext(AdminSessionContext);
  if (!session) {
    throw new Error('La sesión administrativa no está disponible.');
  }
  return session;
}

export function isOwner(session: AdminMeResponse): boolean {
  return session.roles.includes('OWNER');
}

export function canViewDashboard(session: AdminMeResponse): boolean {
  return hasAnyRole(session, ['OWNER', 'ADMIN', 'BRANCH_MANAGER', 'OPERATOR']);
}

export function canViewCatalog(session: AdminMeResponse): boolean {
  return hasAnyRole(session, ['OWNER', 'ADMIN', 'BRANCH_MANAGER', 'EDITOR']);
}

export function canManageCatalog(session: AdminMeResponse): boolean {
  return hasAnyRole(session, ['OWNER', 'ADMIN', 'EDITOR']);
}

export function canManageBranches(session: AdminMeResponse): boolean {
  return hasAnyRole(session, ['OWNER', 'ADMIN']);
}

export function canManagePromotions(session: AdminMeResponse): boolean {
  return hasAnyRole(session, ['OWNER', 'ADMIN', 'EDITOR']);
}

export function canManageOrders(session: AdminMeResponse): boolean {
  return hasAnyRole(session, ['OWNER', 'ADMIN', 'BRANCH_MANAGER', 'OPERATOR']);
}

export function canManageSettings(session: AdminMeResponse): boolean {
  return hasAnyRole(session, ['OWNER', 'ADMIN']);
}

function hasAnyRole(session: AdminMeResponse, roles: string[]): boolean {
  return session.roles.some((role) => roles.includes(role));
}
