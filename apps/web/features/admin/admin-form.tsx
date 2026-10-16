'use client';

import { useRef, useState, type FormEvent, type ReactNode } from 'react';

export function AdminForm({
  children,
  className,
  onSubmit
}: {
  children: ReactNode;
  className: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    try {
      await onSubmit(event);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  return (
    <form className={className} onSubmit={submit} aria-busy={busy}>
      <fieldset className="admin-form-fields" disabled={busy}>
        {children}
      </fieldset>
      {busy ? (
        <p className="admin-help admin-field-wide" role="status">
          Guardando cambios…
        </p>
      ) : null}
    </form>
  );
}
