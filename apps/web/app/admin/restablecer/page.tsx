import { PasswordResetForm } from '../../../features/admin/password-reset-form';

export default function PasswordResetPage() {
  return (
    <main id="main-content" tabIndex={-1} className="admin-login-page">
      <section className="admin-login-card">
        <h1>Restablecer contraseña</h1>
        <PasswordResetForm />
      </section>
    </main>
  );
}
