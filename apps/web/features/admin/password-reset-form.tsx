'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { updateRecoveredPassword } from '../../lib/supabase-auth';

export function PasswordResetForm() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateRecoveredPassword(password);
      setDone(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Intenta nuevamente.');
    } finally {
      setBusy(false);
    }
  }
  if (done)
    return (
      <div>
        <p role="status">Contraseña actualizada. Ingresa al panel con tu nueva contraseña.</p>
        <Link className="admin-primary-button" href="/admin/login">
          Ir al ingreso
        </Link>
      </div>
    );
  return (
    <form className="admin-login-form" onSubmit={submit}>
      <label>
        Nueva contraseña
        <input
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          disabled={busy}
        />
      </label>
      <label>
        Repite la contraseña
        <input
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          required
          disabled={busy}
        />
      </label>
      <p className="admin-help">
        Usa al menos 8 caracteres y una contraseña que no utilices en otro sitio.
      </p>
      {error ? (
        <p className="admin-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="admin-primary-button" disabled={busy}>
        {busy ? 'Guardando…' : 'Guardar contraseña'}
      </button>
      <Link href="/admin/login">Volver al ingreso</Link>
    </form>
  );
}
