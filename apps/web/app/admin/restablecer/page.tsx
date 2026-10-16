import type { Metadata, Viewport } from 'next';
import '../../admin-access.css';
import { AdminAccessLayout } from '../../../features/admin/admin-access-layout';
import { PasswordResetForm } from '../../../features/admin/password-reset-form';

export const metadata: Metadata = {
  title: 'Restablecer contraseña',
  robots: { index: false, follow: false }
};

export const viewport: Viewport = { themeColor: '#142e2a' };

export default function PasswordResetPage() {
  return (
    <AdminAccessLayout>
      <p className="admin-eyebrow">SEGURIDAD DE LA CUENTA</p>
      <h1>Restablecer contraseña</h1>
      <p>Define una contraseña nueva para volver a ingresar al panel.</p>
      <PasswordResetForm />
    </AdminAccessLayout>
  );
}
