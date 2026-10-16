import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import '../../admin-access.css';
import { AdminAccessLayout } from '../../../features/admin/admin-access-layout';
import { AdminLoginForm } from '../../../features/admin/admin-login-form';

export const metadata: Metadata = {
  title: 'Ingreso administrativo',
  robots: { index: false, follow: false }
};

export const viewport: Viewport = { themeColor: '#142e2a' };

export default function AdminLoginPage() {
  return (
    <AdminAccessLayout>
      <p className="admin-eyebrow">ACCESO ADMINISTRATIVO</p>
      <h1>Panel administrativo</h1>
      <p>Ingresa con una cuenta habilitada para administrar la operación.</p>
      <Suspense fallback={<p>Preparando ingreso…</p>}>
        <AdminLoginForm />
      </Suspense>
    </AdminAccessLayout>
  );
}
