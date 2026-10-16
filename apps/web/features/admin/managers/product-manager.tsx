'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { type AdminCategoryResponse, type AdminProductResponse } from '@brasa-viva/contracts';
import {
  createAdminProduct,
  getAdminCategoryOptions,
  getAdminBranchOptions,
  getAdminProducts,
  updateAdminBranchProduct,
  updateAdminProduct
} from '../../../lib/admin-api';
import { getBranches } from '../../../lib/api';
import { formatBs } from '../../../lib/format';
import { canManageBranches, canManageCatalog, useAdminSession } from '../admin-shell';
import { AdminForm } from '../admin-form';
import {
  BranchAssignments,
  ManagerLayout,
  emptyProductForm,
  slugify,
  showError,
  type Notice,
  type BranchOption
} from './shared';

export function ProductManager() {
  const session = useAdminSession();
  const [products, setProducts] = useState<AdminProductResponse[]>([]);
  const [categories, setCategories] = useState<AdminCategoryResponse[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [editing, setEditing] = useState<AdminProductResponse | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyProductForm);
  const canEdit = canManageCatalog(session);

  const load = () => {
    return Promise.all([
      getAdminProducts(page),
      getAdminCategoryOptions(),
      canManageBranches(session)
        ? getAdminBranchOptions().then((result) => result.items)
        : getBranches()
    ])
      .then(([productResult, categoryResult, branchResult]) => {
        setTotal(productResult.pagination.total);
        setProducts(productResult.items);
        setCategories(categoryResult.items);
        setBranches(branchResult.map((branch) => ({ id: branch.id, name: branch.name })));
      })
      .catch(showError(setNotice));
  };
  useEffect(() => {
    void load();
  }, [page]);

  function startEdit(product: AdminProductResponse): void {
    setEditing(product);
    setForm({
      categoryId: product.categoryId,
      name: product.name,
      slug: product.slug,
      description: product.description ?? '',
      basePrice: product.basePrice,
      imageUrl: product.imageUrl ?? '',
      active: product.active,
      featured: product.featured,
      isNew: product.isNew
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    try {
      const input = {
        categoryId: form.categoryId,
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        basePrice: form.basePrice,
        imageUrl: form.imageUrl || null,
        active: form.active,
        featured: form.featured,
        isNew: form.isNew
      };
      if (editing) {
        await updateAdminProduct(editing.id, input);
        setNotice({ kind: 'success', message: 'Producto actualizado.' });
      } else {
        await createAdminProduct({ ...input, branchAssignments: [] });
        setNotice({
          kind: 'success',
          message: 'Producto creado. Asígnalo a una sucursal para publicarlo.'
        });
      }
      setEditing(null);
      setForm(emptyProductForm());
      load();
    } catch (reason) {
      showError(setNotice)(reason);
    }
  }

  async function updateAssignment(
    product: AdminProductResponse,
    branchId: string,
    input: { available?: boolean; priceOverride?: string | null }
  ): Promise<void> {
    try {
      const current = product.branchAssignments.find(
        (assignment) => assignment.branchId === branchId
      );
      await updateAdminBranchProduct(branchId, product.id, {
        available: input.available ?? current?.available ?? true,
        priceOverride:
          input.priceOverride === undefined
            ? (current?.priceOverride ?? null)
            : input.priceOverride,
        stockStatus: current?.stockStatus ?? 'NOT_TRACKED'
      });
      setNotice({ kind: 'success', message: 'Disponibilidad de sucursal actualizada.' });
      await load();
    } catch (reason) {
      showError(setNotice)(reason);
      throw reason;
    }
  }

  return (
    <ManagerLayout
      title="Productos"
      description="Define la información comercial y la disponibilidad por sucursal."
      notice={notice}
      pagination={{ page, total, setPage }}
      onRefresh={load}
    >
      {canEdit ? (
        <AdminForm className="admin-form-grid" onSubmit={submit}>
          <label>
            Categoría
            <select
              value={form.categoryId}
              onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
              required
            >
              <option value="">Selecciona</option>
              {categories
                .filter((category) => category.active)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
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
            Precio base (Bs)
            <input
              inputMode="decimal"
              value={form.basePrice}
              onChange={(event) => setForm({ ...form, basePrice: event.target.value })}
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
          <label className="admin-field-wide">
            URL pública de imagen
            <input
              type="url"
              value={form.imageUrl}
              onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
            />
          </label>
          <div className="admin-check-row">
            <label>
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => setForm({ ...form, active: event.target.checked })}
              />{' '}
              Activo
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) => setForm({ ...form, featured: event.target.checked })}
              />{' '}
              Destacado
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.isNew}
                onChange={(event) => setForm({ ...form, isNew: event.target.checked })}
              />{' '}
              Nuevo
            </label>
          </div>
          <div className="admin-action-row">
            <button className="admin-primary-button" type="submit">
              {editing ? 'Guardar cambios' : 'Crear producto'}
            </button>
            {editing ? (
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => {
                  setEditing(null);
                  setForm(emptyProductForm());
                }}
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </AdminForm>
      ) : null}
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
        <h2>Catálogo</h2>
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio base</th>
                <th>Estado</th>
                <th>Sucursales</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {products
                .filter((entry) =>
                  entry.name.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))
                )
                .map((product) => (
                  <tr key={product.id}>
                    <td data-label="Producto">
                      <strong>{product.name}</strong>
                      <small>{product.categoryName}</small>
                    </td>
                    <td data-label="Precio base">{formatBs(product.basePrice)}</td>
                    <td data-label="Estado">{product.active ? 'Activo' : 'Inactivo'}</td>
                    <td data-label="Sucursales">
                      <BranchAssignments
                        product={product}
                        branches={branches}
                        editable={canEdit || session.roles.includes('BRANCH_MANAGER')}
                        onUpdate={updateAssignment}
                      />
                    </td>
                    <td data-label="Acciones">
                      {canEdit ? (
                        <button
                          type="button"
                          className="admin-secondary-button"
                          onClick={() => startEdit(product)}
                        >
                          Editar
                        </button>
                      ) : null}
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
