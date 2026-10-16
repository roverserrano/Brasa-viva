'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { type AdminBranchResponse } from '@brasa-viva/contracts';
import { createAdminBranch, getAdminBranches, updateAdminBranch } from '../../../lib/admin-api';
import { AdminForm } from '../admin-form';
import { weekdayLabels } from '../../../lib/business-hours';
import { serviceLabels, branchStatusLabels } from '../admin-labels';
import {
  ManagerLayout,
  emptyBranchForm,
  slugify,
  toggleId,
  showError,
  type Notice
} from './shared';

export function BranchManager() {
  const [branches, setBranches] = useState<AdminBranchResponse[]>([]);
  const [editing, setEditing] = useState<AdminBranchResponse | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyBranchForm);
  const load = () =>
    getAdminBranches(page)
      .then((result) => {
        setTotal(result.pagination.total);
        setBranches(result.items);
      })
      .catch(showError(setNotice));
  useEffect(() => {
    void load();
  }, [page]);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const input = {
      code: form.code,
      name: form.name,
      slug: form.slug,
      addressLine: form.addressLine,
      description: form.description || null,
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      imageUrl: form.imageUrl || null,
      googleMapsUrl: form.googleMapsUrl || null,
      city: form.city,
      department: form.department,
      countryCode: form.countryCode,
      timezone: form.timezone,
      status: form.status,
      services: form.services,
      businessHours: form.businessHours
    };
    try {
      if (editing) {
        await updateAdminBranch(editing.id, input);
      } else {
        await createAdminBranch(input);
      }
      setNotice({
        kind: 'success',
        message: editing ? 'Sucursal actualizada.' : 'Sucursal creada.'
      });
      setEditing(null);
      setForm(emptyBranchForm());
      load();
    } catch (reason) {
      showError(setNotice)(reason);
    }
  }

  return (
    <ManagerLayout
      title="Sucursales"
      description="Gestiona los datos visibles y los servicios de cada punto de atención."
      notice={notice}
      pagination={{ page, total, setPage }}
      onRefresh={load}
    >
      <AdminForm className="admin-form-grid" onSubmit={submit}>
        <label>
          Código
          <input
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
            required
          />
        </label>
        <label>
          Nombre
          <input
            value={form.name}
            onChange={(event) =>
              setForm({
                ...form,
                name: event.target.value,
                slug:
                  form.slug === slugify(form.name) || !editing
                    ? slugify(event.target.value)
                    : form.slug
              })
            }
            required
          />
        </label>
        <label>
          Enlace del menú (se genera con el nombre)
          <input
            value={form.slug}
            onChange={(event) => setForm({ ...form, slug: slugify(event.target.value) })}
            required
          />
        </label>
        <label>
          Dirección
          <input
            value={form.addressLine}
            onChange={(event) => setForm({ ...form, addressLine: event.target.value })}
            required
          />
        </label>
        <label>
          WhatsApp
          <input
            value={form.whatsapp}
            onChange={(event) => setForm({ ...form, whatsapp: event.target.value })}
          />
        </label>
        <label>
          Teléfono
          <input
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
        </label>
        <label className="admin-field-wide">
          URL de imagen
          <input
            type="url"
            value={form.imageUrl}
            onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
          />
        </label>
        <label>
          Estado
          <select
            value={form.status}
            onChange={(event) =>
              setForm({ ...form, status: event.target.value as AdminBranchResponse['status'] })
            }
          >
            {Object.entries(branchStatusLabels).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Enlace de Google Maps
          <input
            type="url"
            value={form.googleMapsUrl}
            onChange={(event) => setForm({ ...form, googleMapsUrl: event.target.value })}
          />
        </label>
        <fieldset className="admin-field-wide">
          <legend>Servicios disponibles</legend>
          <div className="admin-check-list">
            {Object.entries(serviceLabels).map(([service, label]) => (
              <label key={service}>
                <input
                  type="checkbox"
                  checked={form.services.includes(
                    service as AdminBranchResponse['services'][number]
                  )}
                  onChange={() =>
                    setForm({
                      ...form,
                      services: toggleId(
                        form.services,
                        service as AdminBranchResponse['services'][number]
                      )
                    })
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="admin-field-wide">
          <legend>Horario semanal</legend>
          <p className="admin-help">
            Activa los días de atención e ingresa las horas de apertura y cierre.
          </p>
          {weekdayLabels.map((day, weekday) => {
            const hour = form.businessHours.find((entry) => entry.weekday === weekday) ?? {
              weekday,
              opensAt: null,
              closesAt: null,
              isClosed: true
            };
            function change(values: Partial<typeof hour>) {
              setForm({
                ...form,
                businessHours: [
                  ...form.businessHours.filter((entry) => entry.weekday !== weekday),
                  { ...hour, ...values }
                ]
              });
            }
            return (
              <div className="admin-hours-row" key={day}>
                <label>
                  <input
                    type="checkbox"
                    checked={!hour.isClosed}
                    onChange={(event) =>
                      change({
                        isClosed: !event.target.checked,
                        opensAt: hour.opensAt ?? '11:00',
                        closesAt: hour.closesAt ?? '22:00'
                      })
                    }
                  />
                  {day}
                </label>
                <label>
                  Apertura
                  <input
                    type="time"
                    disabled={hour.isClosed}
                    value={hour.opensAt ?? ''}
                    onChange={(event) => change({ opensAt: event.target.value || null })}
                  />
                </label>
                <label>
                  Cierre
                  <input
                    type="time"
                    disabled={hour.isClosed}
                    value={hour.closesAt ?? ''}
                    onChange={(event) => change({ closesAt: event.target.value || null })}
                  />
                </label>
              </div>
            );
          })}
        </fieldset>
        <div className="admin-action-row">
          <button type="submit" className="admin-primary-button">
            {editing ? 'Guardar cambios' : 'Crear sucursal'}
          </button>
          {editing ? (
            <button
              className="admin-secondary-button"
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(emptyBranchForm());
              }}
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </AdminForm>
      <label className="admin-list-search">
        Buscar en esta página
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Escribe un nombre…"
        />
      </label>
      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sucursal</th>
                <th>Dirección</th>
                <th>Servicios</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {branches
                .filter((entry) =>
                  entry.name.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))
                )
                .map((branch) => (
                  <tr key={branch.id}>
                    <td data-label="Sucursal">{branch.name}</td>
                    <td data-label="Dirección">{branch.addressLine}</td>
                    <td data-label="Servicios">
                      {branch.services.map((service) => serviceLabels[service]).join(', ') ||
                        'Sin servicios'}
                    </td>
                    <td data-label="Estado">{branchStatusLabels[branch.status]}</td>
                    <td data-label="Acciones">
                      <button
                        className="admin-secondary-button"
                        type="button"
                        onClick={() => {
                          setEditing(branch);
                          setForm({
                            code: branch.code,
                            name: branch.name,
                            slug: branch.slug,
                            addressLine: branch.addressLine,
                            description: branch.description ?? '',
                            whatsapp: branch.whatsapp ?? '',
                            phone: branch.phone ?? '',
                            imageUrl: branch.imageUrl ?? '',
                            googleMapsUrl: branch.googleMapsUrl ?? '',
                            services: branch.services,
                            businessHours: branch.businessHours,
                            status: branch.status,
                            city: branch.city,
                            department: branch.department,
                            countryCode: branch.countryCode,
                            timezone: branch.timezone
                          });
                        }}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </ManagerLayout>
  );
}
