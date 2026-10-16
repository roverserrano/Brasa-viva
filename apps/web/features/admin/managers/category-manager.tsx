'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { type AdminCategoryResponse } from '@brasa-viva/contracts';
import {
  createAdminCategory,
  getAdminCategories,
  updateAdminCategory
} from '../../../lib/admin-api';
import { AdminForm } from '../admin-form';
import { ManagerLayout, slugify, showError, type Notice } from './shared';

export function CategoryManager() {
  const [categories, setCategories] = useState<AdminCategoryResponse[]>([]);
  const [editing, setEditing] = useState<AdminCategoryResponse | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', slug: '', description: '', displayOrder: '0' });

  const load = () =>
    getAdminCategories(page)
      .then((result) => {
        setTotal(result.pagination.total);
        setCategories(result.items);
      })
      .catch(showError(setNotice));
  useEffect(() => {
    void load();
  }, [page]);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    try {
      const input = {
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        displayOrder: Number(form.displayOrder),
        active: true
      };
      if (editing) {
        await updateAdminCategory(editing.id, { ...input, active: editing.active });
      } else {
        await createAdminCategory(input);
      }
      setForm({ name: '', slug: '', description: '', displayOrder: '0' });
      setEditing(null);
      setNotice({
        kind: 'success',
        message: editing ? 'Categoría actualizada.' : 'Categoría creada.'
      });
      load();
    } catch (reason) {
      showError(setNotice)(reason);
    }
  }

  async function toggle(category: AdminCategoryResponse): Promise<void> {
    try {
      await updateAdminCategory(category.id, { active: !category.active });
      load();
    } catch (reason) {
      showError(setNotice)(reason);
    }
  }

  return (
    <ManagerLayout
      title="Categorías"
      description="Organiza el menú público y controla qué categorías se muestran."
      notice={notice}
      pagination={{ page, total, setPage }}
      onRefresh={load}
    >
      <AdminForm className="admin-form-grid" onSubmit={submit}>
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
          Orden
          <input
            type="number"
            min="0"
            value={form.displayOrder}
            onChange={(event) => setForm({ ...form, displayOrder: event.target.value })}
            required
          />
        </label>
        <label className="admin-field-wide">
          Descripción
          <input
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </label>
        <div className="admin-action-row">
          <button className="admin-primary-button" type="submit">
            {editing ? 'Guardar categoría' : 'Crear categoría'}
          </button>
          {editing ? (
            <button
              className="admin-secondary-button"
              type="button"
              onClick={() => {
                setEditing(null);
                setForm({ name: '', slug: '', description: '', displayOrder: '0' });
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
        <h2>Categorías actuales</h2>
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Slug</th>
                <th>Orden</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {categories
                .filter((entry) =>
                  entry.name.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))
                )
                .map((category) => (
                  <tr key={category.id}>
                    <td data-label="Nombre">{category.name}</td>
                    <td data-label="Slug">{category.slug}</td>
                    <td data-label="Orden">{category.displayOrder}</td>
                    <td data-label="Estado">{category.active ? 'Activa' : 'Inactiva'}</td>
                    <td data-label="Acciones">
                      <div className="admin-action-row">
                        <button
                          className="admin-secondary-button"
                          type="button"
                          onClick={() => {
                            setEditing(category);
                            setForm({
                              name: category.name,
                              slug: category.slug,
                              description: category.description ?? '',
                              displayOrder: String(category.displayOrder)
                            });
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className="admin-secondary-button"
                          type="button"
                          onClick={() => toggle(category)}
                        >
                          {category.active ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
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
