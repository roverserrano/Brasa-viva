'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAdminMe } from '../../lib/admin-api';
import { requestPasswordReset, signInWithPassword, signOut } from '../../lib/supabase-auth';

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      await signInWithPassword(email.trim(), password);
      await getAdminMe();
      const next = searchParams.get('next');
      const safeNext =
        next &&
        /^\/admin(?:\/|$)/.test(next) &&
        !next.includes('\\') &&
        !next.startsWith('/admin/login')
          ? next
          : '/admin';
      router.replace(safeNext);
    } catch (reason) {
      await signOut().catch(() => undefined);
      setError(reason instanceof Error ? reason.message : 'No fue posible iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRecovery(): Promise<void> {
    setError(null);
    setMessage(null);
    if (!email.trim()) {
      setError('Ingresa tu correo para solicitar el restablecimiento.');
      return;
    }
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setMessage(
        'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.'
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'No fue posible solicitar el restablecimiento.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="admin-login-form" onSubmit={handleSubmit}>
      <label>
        Correo administrativo
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label>
        Contraseña
        <input
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      <button
        className="admin-link-button"
        type="button"
        aria-pressed={showPassword}
        onClick={() => setShowPassword((value) => !value)}
      >
        {showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      </button>
      {error ? (
        <p className="admin-error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="admin-success" role="status">
          {message}
        </p>
      ) : null}
      <button type="submit" className="admin-primary-button" disabled={submitting}>
        {submitting ? 'Verificando…' : 'Ingresar al panel'}
      </button>
      <button
        type="button"
        className="admin-link-button"
        onClick={handleRecovery}
        disabled={submitting}
      >
        Restablecer contraseña
      </button>
    </form>
  );
}
