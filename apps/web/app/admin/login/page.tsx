import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminLoginForm } from '../../../features/admin/admin-login-form';

export const metadata: Metadata = {
  title: 'Ingreso administrativo',
  robots: { index: false, follow: false }
};

export default function AdminLoginPage() {
  return (
    <main id="main-content" tabIndex={-1} className="admin-login-page">
      <section className="admin-login-card">
        <span className="admin-login-brand" aria-hidden="true">
          BV
        </span>
        <p className="admin-eyebrow">BRASA VIVA · COCHABAMBA</p>
        <h1>Panel administrativo</h1>
        <p>Ingresa con una cuenta habilitada para administrar la operación.</p>
        <Suspense fallback={<p>Preparando ingreso…</p>}>
          <AdminLoginForm />
        </Suspense>
      </section>
    </main>
  );
}
