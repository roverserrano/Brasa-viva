'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { getAdminSettings, upsertAdminSetting } from '../../../lib/admin-api';
import { AdminForm } from '../admin-form';
import { ManagerLayout, showError, type Notice } from './shared';

export function SettingsManager() {
  const [settings, setSettings] = useState<Awaited<ReturnType<typeof getAdminSettings>>>([]);
  const [notice, setNotice] = useState<Notice>(null);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({ name: '', currency: 'BOB', locale: 'es-BO' });
  async function load() {
    try {
      const records = await getAdminSettings();
      setSettings(records);
      const brand = records.find((setting) => setting.settingKey === 'brand')?.settingValue;
      setForm({
        name: typeof brand?.name === 'string' ? brand.name : 'Brasa Viva',
        currency: 'BOB',
        locale: 'es-BO'
      });
      setLoaded(true);
    } catch (reason) {
      showError(setNotice)(reason);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    try {
      const previous = settings.find((setting) => setting.settingKey === 'brand');
      await upsertAdminSetting('brand', {
        settingValue: { ...previous?.settingValue, ...form },
        description: previous?.description,
        isPublic: true
      });
      setNotice({ kind: 'success', message: 'Configuración de marca guardada.' });
      await load();
    } catch (reason) {
      showError(setNotice)(reason);
    }
  }
  return (
    <ManagerLayout
      title="Configuración"
      description="Mantén la información de marca registrada para la operación del restaurante."
      notice={notice}
    >
      {loaded ? (
        <AdminForm className="admin-form-grid" onSubmit={submit}>
          <label>
            Nombre del restaurante
            <input
              value={form.name}
              maxLength={160}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </label>
          <label>
            Moneda
            <input value="Bolivianos (Bs)" readOnly />
          </label>
          <label>
            Idioma y región
            <input value="Español · Bolivia" readOnly />
          </label>
          <p className="admin-help admin-field-wide">
            Los precios se registran en bolivianos. Cambiar la moneda requiere revisar el catálogo y
            los pedidos existentes.
          </p>
          <button type="submit" className="admin-primary-button">
            Guardar configuración
          </button>
        </AdminForm>
      ) : (
        <p role="status">Cargando configuración…</p>
      )}
      <section className="admin-panel">
        <h2>Información de operación</h2>
        <p>
          Para cambiar productos, precios, horarios o servicios, usa su sección en el menú
          administrativo.
        </p>
        <p>Los cambios conservan un registro de auditoría para el propietario.</p>
      </section>
    </ManagerLayout>
  );
}
