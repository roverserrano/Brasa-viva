'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import type {
  AdminBranchResponse,
  AdminCategoryResponse,
  AdminProductResponse,
  AdminPromotionResponse,
  AdminUserResponse,
  OrderStatus
} from '@brasa-viva/contracts';
import {
  createAdminBranch,
  createAdminCategory,
  createAdminProduct,
  createAdminPromotion,
  createAdminUserAccess,
  getAdminBranches,
  getAdminCategoryOptions,
  getAdminProductOptions,
  getAdminBranchOptions,
  getAdminCategories,
  getAdminOrders,
  getAdminProducts,
  getAdminPromotions,
  getAdminSettings,
  getAdminUsers,
  updateAdminBranch,
  updateAdminBranchProduct,
  updateAdminCategory,
  updateAdminOrderStatus,
  updateAdminProduct,
  updateAdminPromotion,
  updateAdminUserAccess,
  upsertAdminSetting
} from '../../lib/admin-api';
import { getBranches } from '../../lib/api';
import { canManageBranches, canManageCatalog, useAdminSession } from './admin-shell';

import { AdminForm } from './admin-form';
import { roleLabels, serviceLabels, userStatusLabels, branchStatusLabels } from './admin-labels';
import { orderStatusLabels, permittedOrderTransitions } from '@brasa-viva/contracts';

type Notice = { kind: 'error' | 'success'; message: string } | null;
type BranchOption = Pick<AdminBranchResponse, 'id' | 'name'>;
type PromotionType = 'FIXED_PRICE' | 'PERCENTAGE' | 'FIXED_DISCOUNT' | 'BUNDLE';

const roles = ['OWNER', 'ADMIN', 'BRANCH_MANAGER', 'EDITOR', 'OPERATOR'] as const;

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
                    <td data-label="Precio base">Bs {product.basePrice}</td>
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
          {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(
            (day, weekday) => {
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
            }
          )}
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

export function PromotionManager() {
  const [promotions, setPromotions] = useState<AdminPromotionResponse[]>([]);
  const [editing, setEditing] = useState<AdminPromotionResponse | null>(null);
  const [products, setProducts] = useState<AdminProductResponse[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [notice, setNotice] = useState<Notice>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyPromotionForm);
  const load = () =>
    Promise.all([getAdminPromotions(page), getAdminProductOptions(), getBranches()])
      .then(([promotionResult, productResult, branchResult]) => {
        setTotal(promotionResult.pagination.total);
        setPromotions(promotionResult.items);
        setProducts(productResult.items);
        setBranches(branchResult.map((branch) => ({ id: branch.id, name: branch.name })));
      })
      .catch(showError(setNotice));
  useEffect(() => {
    void load();
  }, [page]);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    try {
      const input = {
        ...promotionInput(form),
        active: editing?.active ?? true,
        description: editing?.description ?? null,
        imageUrl: editing?.imageUrl ?? null
      };
      if (editing) {
        await updateAdminPromotion(editing.id, input);
      } else {
        await createAdminPromotion(input);
      }
      setNotice({
        kind: 'success',
        message: editing ? 'Promoción actualizada.' : 'Promoción creada.'
      });
      setEditing(null);
      setForm(emptyPromotionForm());
      load();
    } catch (reason) {
      showError(setNotice)(reason);
    }
  }
  async function toggle(promotion: AdminPromotionResponse): Promise<void> {
    try {
      await updateAdminPromotion(promotion.id, { active: !promotion.active });
      load();
    } catch (reason) {
      showError(setNotice)(reason);
    }
  }
  return (
    <ManagerLayout
      title="Promociones"
      description="Publica promociones simples, su vigencia y el alcance por sucursal."
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
          Tipo
          <select
            value={form.type}
            onChange={(event) => setForm({ ...form, type: event.target.value as PromotionType })}
          >
            <option value="FIXED_PRICE">Precio fijo</option>
            <option value="PERCENTAGE">Porcentaje</option>
            <option value="FIXED_DISCOUNT">Descuento fijo</option>
          </select>
        </label>
        <label>
          {form.type === 'PERCENTAGE' ? 'Porcentaje' : 'Importe (Bs)'}
          <input
            inputMode="decimal"
            value={form.value}
            onChange={(event) => setForm({ ...form, value: event.target.value })}
            required
          />
        </label>
        <label>
          Inicio
          <input
            type="datetime-local"
            value={form.startsAt}
            onChange={(event) => setForm({ ...form, startsAt: event.target.value })}
            required
          />
        </label>
        <label>
          Fin
          <input
            type="datetime-local"
            value={form.endsAt}
            onChange={(event) => setForm({ ...form, endsAt: event.target.value })}
            required
          />
        </label>
        <fieldset className="admin-field-wide">
          <legend>Productos incluidos</legend>
          <div className="admin-check-list">
            {products
              .filter((product) => product.active)
              .map((product) => (
                <label key={product.id}>
                  <input
                    type="checkbox"
                    checked={form.productIds.includes(product.id)}
                    onChange={() =>
                      setForm({ ...form, productIds: toggleId(form.productIds, product.id) })
                    }
                  />{' '}
                  {product.name}
                </label>
              ))}
          </div>
        </fieldset>
        <fieldset className="admin-field-wide">
          <legend>Alcance de sucursales</legend>
          <p className="admin-help">Sin selección significa todas las sucursales.</p>
          <div className="admin-check-list">
            {branches.map((branch) => (
              <label key={branch.id}>
                <input
                  type="checkbox"
                  checked={form.branchIds.includes(branch.id)}
                  onChange={() =>
                    setForm({ ...form, branchIds: toggleId(form.branchIds, branch.id) })
                  }
                />{' '}
                {branch.name}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="admin-action-row">
          <button className="admin-primary-button" type="submit">
            {editing ? 'Guardar promoción' : 'Crear promoción'}
          </button>
          {editing ? (
            <button
              className="admin-secondary-button"
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(emptyPromotionForm());
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
                <th>Promoción</th>
                <th>Vigencia</th>
                <th>Productos</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {promotions
                .filter((entry) =>
                  entry.name.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))
                )
                .map((promotion) => (
                  <tr key={promotion.id}>
                    <td data-label="Promoción">{promotion.name}</td>
                    <td data-label="Vigencia">
                      {new Date(promotion.startsAt).toLocaleString('es-BO')} –{' '}
                      {new Date(promotion.endsAt).toLocaleString('es-BO')}
                    </td>
                    <td data-label="Productos">{promotion.productIds.length}</td>
                    <td data-label="Estado">
                      {promotion.productIds.length === 0
                        ? 'Incompleta'
                        : promotion.active
                          ? 'Activa'
                          : 'Inactiva'}
                    </td>
                    <td data-label="Acciones">
                      <div className="admin-action-row">
                        <button
                          type="button"
                          className="admin-secondary-button"
                          onClick={() => {
                            setEditing(promotion);
                            setForm({
                              name: promotion.name,
                              slug: promotion.slug,
                              type: promotion.promotionType,
                              value:
                                promotion.promoPrice ??
                                promotion.discountPercent ??
                                promotion.discountAmount ??
                                '',
                              startsAt: toDateTimeLocal(new Date(promotion.startsAt)),
                              endsAt: toDateTimeLocal(new Date(promotion.endsAt)),
                              productIds: promotion.productIds,
                              branchIds: promotion.branchIds
                            });
                          }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="admin-secondary-button"
                          onClick={() => toggle(promotion)}
                          disabled={!promotion.active && promotion.productIds.length === 0}
                        >
                          {promotion.active ? 'Desactivar' : 'Activar'}
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

export function OrderManager() {
  const [result, setResult] = useState<Awaited<ReturnType<typeof getAdminOrders>> | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [changing, setChanging] = useState<string | null>(null);
  const load = async () => {
    setLoading(true);
    try {
      setResult(await getAdminOrders(page));
    } catch (reason) {
      showError(setNotice)(reason);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [page]);
  async function changeStatus(orderId: string, status: OrderStatus): Promise<void> {
    if (changing) return;
    if (
      status === 'CANCELLED' &&
      !window.confirm('¿Cancelar este pedido? Su registro se conservará.')
    )
      return;
    setChanging(orderId);
    try {
      await updateAdminOrderStatus(orderId, { status });
      setNotice({ kind: 'success', message: 'Estado del pedido actualizado.' });
      await load();
    } catch (reason) {
      showError(setNotice)(reason);
    } finally {
      setChanging(null);
    }
  }
  return (
    <ManagerLayout
      title="Pedidos"
      description="Revisa los detalles y avanza cada pedido según su preparación. Los pedidos entregados o cancelados conservan su historial."
      notice={notice}
    >
      <div className="admin-action-row">
        <button type="button" className="admin-secondary-button" onClick={load} disabled={loading}>
          {loading ? 'Actualizando…' : 'Actualizar pedidos'}
        </button>
        <p className="admin-help" role="status">
          {result ? `${result.pagination.total} pedidos registrados` : 'Cargando pedidos…'}
        </p>
      </div>
      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Sucursal</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {result?.items.map((order) => (
                <tr key={order.id}>
                  <td data-label="Pedido">
                    {order.orderCode ?? 'Pendiente'}
                    <small>
                      {new Date(order.createdAt).toLocaleString('es-BO', {
                        timeZone: 'America/La_Paz'
                      })}
                    </small>
                    <details>
                      <summary>Ver productos y entrega</summary>
                      <p>
                        {order.orderType === 'PICKUP'
                          ? 'Recojo en sucursal'
                          : 'Delivery coordinado'}
                      </p>
                      <ul>
                        {order.items.map((item) => (
                          <li key={item.id}>
                            {item.quantity} × {item.productName} — Bs {item.lineTotal}
                          </li>
                        ))}
                      </ul>
                      {order.deliveryAddress ? <p>Dirección: {order.deliveryAddress}</p> : null}
                      {order.notes ? <p>Notas: {order.notes}</p> : null}
                    </details>
                  </td>
                  <td data-label="Cliente">
                    {order.customerName}
                    <small>{order.customerPhone}</small>
                  </td>
                  <td data-label="Sucursal">{order.branchName}</td>
                  <td data-label="Total">Bs {order.total}</td>
                  <td data-label="Estado">
                    <strong>{orderStatusLabels[order.status]}</strong>
                    {permittedOrderTransitions[order.status].length ? (
                      <label className="admin-status-control">
                        Cambiar a
                        <select
                          aria-label={`Nuevo estado de ${order.orderCode}`}
                          value=""
                          disabled={Boolean(changing) || loading}
                          onChange={(event) => {
                            if (event.target.value)
                              void changeStatus(order.id, event.target.value as OrderStatus);
                          }}
                        >
                          <option value="">Elige una acción</option>
                          {permittedOrderTransitions[order.status].map((status) => (
                            <option key={status} value={status}>
                              {orderStatusLabels[status]}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <small>Pedido finalizado</small>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {result?.items.length === 0 ? <p>No hay pedidos en esta página.</p> : null}
      </section>
      <nav aria-label="Páginas de pedidos" className="admin-action-row">
        <button
          type="button"
          className="admin-secondary-button"
          disabled={page === 1 || loading}
          onClick={() => setPage(page - 1)}
        >
          Anterior
        </button>
        <span>Página {page}</span>
        <button
          type="button"
          className="admin-secondary-button"
          disabled={
            !result || page * result.pagination.pageSize >= result.pagination.total || loading
          }
          onClick={() => setPage(page + 1)}
        >
          Siguiente
        </button>
      </nav>
    </ManagerLayout>
  );
}

export function UserManager() {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [editing, setEditing] = useState<AdminUserResponse | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [newUser, setNewUser] = useState({
    email: '',
    fullName: '',
    role: 'OPERATOR' as (typeof roles)[number],
    branchIds: [] as string[]
  });
  const load = () =>
    Promise.all([getAdminUsers(page), getAdminBranchOptions()])
      .then(([userResult, branchResult]) => {
        setTotal(userResult.pagination.total);
        setUsers(userResult.items);
        setBranches(branchResult.items.map((branch) => ({ id: branch.id, name: branch.name })));
      })
      .catch(showError(setNotice));
  useEffect(() => {
    void load();
  }, [page]);
  async function save(): Promise<void> {
    if (!editing) return;
    try {
      await updateAdminUserAccess(editing.id, {
        status: editing.status,
        roles: editing.roles,
        branchIds: editing.branchIds
      });
      setNotice({ kind: 'success', message: 'Acceso actualizado.' });
      setEditing(null);
      load();
    } catch (reason) {
      showError(setNotice)(reason);
    }
  }
  async function create(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    try {
      await createAdminUserAccess({
        email: newUser.email,
        fullName: newUser.fullName,
        status: 'ACTIVE',
        roles: [newUser.role],
        branchIds: newUser.branchIds
      });
      setNewUser({ email: '', fullName: '', role: 'OPERATOR', branchIds: [] });
      setNotice({
        kind: 'success',
        message: 'Acceso creado. La cuenta debe existir en Supabase Auth con el mismo correo.'
      });
      load();
    } catch (reason) {
      showError(setNotice)(reason);
    }
  }
  return (
    <ManagerLayout
      title="Usuarios"
      description="Preautoriza cuentas de Supabase Auth, asigna roles y limita su alcance por sucursal."
      notice={notice}
      pagination={{ page, total, setPage }}
      onRefresh={load}
    >
      <AdminForm className="admin-form-grid" onSubmit={create}>
        <label>
          Nombre completo
          <input
            value={newUser.fullName}
            onChange={(event) => setNewUser({ ...newUser, fullName: event.target.value })}
            required
          />
        </label>
        <label>
          Correo de Supabase Auth
          <input
            type="email"
            value={newUser.email}
            onChange={(event) => setNewUser({ ...newUser, email: event.target.value })}
            required
          />
        </label>
        <label>
          Rol inicial
          <select
            value={newUser.role}
            onChange={(event) =>
              setNewUser({ ...newUser, role: event.target.value as (typeof roles)[number] })
            }
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Sucursales asignadas</legend>
          <p>
            Los encargados y operadores necesitan una sucursal asignada para gestionar sus pedidos.
          </p>
          <div className="admin-check-list">
            {branches.map((branch) => (
              <label key={branch.id}>
                <input
                  type="checkbox"
                  checked={newUser.branchIds.includes(branch.id)}
                  onChange={() =>
                    setNewUser({ ...newUser, branchIds: toggleId(newUser.branchIds, branch.id) })
                  }
                />{' '}
                {branch.name}
              </label>
            ))}
          </div>
        </fieldset>
        <button className="admin-primary-button" type="submit">
          Preautorizar usuario
        </button>
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
                <th>Usuario</th>
                <th>Roles</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users
                .filter((entry) =>
                  entry.fullName.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))
                )
                .map((user) => (
                  <tr key={user.id}>
                    <td data-label="Usuario">
                      {user.fullName}
                      <small>{user.email}</small>
                    </td>
                    <td data-label="Roles">
                      {user.roles.map((role) => roleLabels[role]).join(', ')}
                    </td>
                    <td data-label="Estado">{userStatusLabels[user.status]}</td>
                    <td data-label="Acciones">
                      <button
                        className="admin-secondary-button"
                        type="button"
                        onClick={() =>
                          setEditing({
                            ...user,
                            roles: [...user.roles],
                            branchIds: [...user.branchIds]
                          })
                        }
                      >
                        Editar acceso
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
      {editing ? (
        <section className="admin-panel">
          <h2>Acceso de {editing.fullName}</h2>
          <AdminForm
            className="admin-form-grid"
            onSubmit={async (event) => {
              event.preventDefault();
              await save();
            }}
          >
            <label>
              Estado
              <select
                value={editing.status}
                onChange={(event) =>
                  setEditing({
                    ...editing,
                    status: event.target.value as AdminUserResponse['status']
                  })
                }
              >
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
                <option value="SUSPENDED">Suspendido</option>
              </select>
            </label>
            <fieldset>
              <legend>Roles</legend>
              <div className="admin-check-list">
                {roles.map((role) => (
                  <label key={role}>
                    <input
                      type="checkbox"
                      checked={editing.roles.includes(role)}
                      onChange={() =>
                        setEditing({
                          ...editing,
                          roles: toggleId(editing.roles, role) as AdminUserResponse['roles']
                        })
                      }
                    />{' '}
                    {roleLabels[role]}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Sucursales asignadas</legend>
              <div className="admin-check-list">
                {branches.map((branch) => (
                  <label key={branch.id}>
                    <input
                      type="checkbox"
                      checked={editing.branchIds.includes(branch.id)}
                      onChange={() =>
                        setEditing({
                          ...editing,
                          branchIds: toggleId(editing.branchIds, branch.id)
                        })
                      }
                    />{' '}
                    {branch.name}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="admin-action-row">
              <button className="admin-primary-button" type="submit">
                Guardar acceso
              </button>
              <button
                className="admin-secondary-button"
                type="button"
                onClick={() => setEditing(null)}
              >
                Cancelar
              </button>
            </div>
          </AdminForm>
        </section>
      ) : null}
    </ManagerLayout>
  );
}

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

function BranchAssignments({
  product,
  branches,
  editable,
  onUpdate
}: Readonly<{
  product: AdminProductResponse;
  branches: BranchOption[];
  editable: boolean;
  onUpdate: (
    product: AdminProductResponse,
    branchId: string,
    input: { available?: boolean; priceOverride?: string | null }
  ) => Promise<void>;
}>) {
  const session = useAdminSession();
  const [priceEditing, setPriceEditing] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const assignedIds = new Set(product.branchAssignments.map((assignment) => assignment.branchId));
  const permittedBranches = branches.filter(
    (branch) =>
      !session.roles.includes('BRANCH_MANAGER') ||
      canManageCatalog(session) ||
      session.branchIds.includes(branch.id)
  );
  const availableBranches = permittedBranches.filter((branch) => !assignedIds.has(branch.id));
  async function update(
    branchId: string,
    input: { available?: boolean; priceOverride?: string | null }
  ) {
    if (busy) return false;
    setBusy(true);
    try {
      await onUpdate(product, branchId, input);
      return true;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin-assignments">
      {product.branchAssignments.map((assignment) => (
        <div key={assignment.branchId}>
          <strong>{assignment.branchName}</strong>
          <span>
            : {assignment.available ? 'Disponible' : 'No disponible'} · Bs{' '}
            {assignment.priceOverride ?? product.basePrice}
          </span>
          {editable ? (
            <div className="admin-action-row">
              <button
                disabled={busy}
                type="button"
                className="admin-inline-button"
                onClick={() => update(assignment.branchId, { available: !assignment.available })}
              >
                {assignment.available ? 'Ocultar' : 'Habilitar'}
              </button>
              <button
                disabled={busy}
                type="button"
                className="admin-inline-button"
                onClick={() => {
                  setPriceEditing(assignment.branchId);
                  setPrice(assignment.priceOverride ?? '');
                }}
              >
                Cambiar precio
              </button>
            </div>
          ) : null}
          {priceEditing === assignment.branchId ? (
            <div className="admin-price-editor">
              <label>
                Precio en {assignment.branchName}
                <input
                  aria-label={`Precio en ${assignment.branchName}`}
                  inputMode="decimal"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder={product.basePrice}
                />
              </label>
              <small>Deja vacío para usar Bs {product.basePrice} del catálogo.</small>
              <button
                className="admin-secondary-button"
                type="button"
                disabled={busy}
                onClick={async () => {
                  if (await update(assignment.branchId, { priceOverride: price.trim() || null }))
                    setPriceEditing(null);
                }}
              >
                Guardar precio
              </button>
              <button
                className="admin-inline-button"
                type="button"
                onClick={() => setPriceEditing(null)}
              >
                Cancelar
              </button>
            </div>
          ) : null}
        </div>
      ))}
      {editable && availableBranches.length > 0 ? (
        <label>
          Ofrecer en otra sucursal
          <select
            aria-label={`Asignar sucursal a ${product.name}`}
            disabled={busy}
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) {
                void update(event.target.value, { available: true });
                event.currentTarget.value = '';
              }
            }}
          >
            <option value="">Elige sucursal…</option>
            {availableBranches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {!product.branchAssignments.length ? (
        <small>Asigna una sucursal para que aparezca en el menú.</small>
      ) : null}
    </div>
  );
}

function ManagerLayout({
  title,
  description,
  notice,
  children,
  pagination,
  onRefresh
}: Readonly<{
  title: string;
  description: string;
  notice: Notice;
  children: ReactNode;
  pagination?: { page: number; total: number | null; setPage: (page: number) => void };
  onRefresh?: () => void;
}>) {
  return (
    <section className="admin-page admin-page-stack">
      <header>
        <p className="admin-eyebrow">OPERACIÓN</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      {notice ? (
        <p
          className={notice.kind === 'error' ? 'admin-error' : 'admin-success'}
          role={notice.kind === 'error' ? 'alert' : 'status'}
        >
          {notice.message}
        </p>
      ) : null}
      {onRefresh ? (
        <button className="admin-secondary-button" type="button" onClick={onRefresh}>
          Actualizar lista
        </button>
      ) : null}
      {pagination?.total === null ? <p role="status">Cargando registros…</p> : null}
      {children}
      {pagination ? (
        <nav className="admin-action-row" aria-label={`Páginas de ${title}`}>
          <button
            type="button"
            className="admin-secondary-button"
            disabled={pagination.page === 1}
            onClick={() => pagination.setPage(pagination.page - 1)}
          >
            Anterior
          </button>
          <span>
            Página {pagination.page} · {pagination.total ?? '…'} registros
          </span>
          <button
            type="button"
            className="admin-secondary-button"
            disabled={pagination.total === null || pagination.page * 100 >= pagination.total}
            onClick={() => pagination.setPage(pagination.page + 1)}
          >
            Siguiente
          </button>
          {pagination.total === 0 ? (
            <p>No hay registros todavía. Usa el formulario para crear el primero.</p>
          ) : null}
        </nav>
      ) : null}
    </section>
  );
}

function emptyProductForm() {
  return {
    categoryId: '',
    name: '',
    slug: '',
    description: '',
    basePrice: '',
    imageUrl: '',
    active: true,
    featured: false,
    isNew: false
  };
}
function emptyBranchForm() {
  return {
    code: '',
    name: '',
    slug: '',
    addressLine: '',
    description: '',
    whatsapp: '',
    phone: '',
    imageUrl: '',
    googleMapsUrl: '',
    services: ['PICKUP'] as AdminBranchResponse['services'],
    businessHours: [] as AdminBranchResponse['businessHours'],
    status: 'ACTIVE' as AdminBranchResponse['status'],
    city: 'Cochabamba',
    department: 'Cochabamba',
    countryCode: 'BO',
    timezone: 'America/La_Paz'
  };
}
function emptyPromotionForm() {
  const now = new Date();
  const end = new Date(now.getTime() + 24 * 60 * 60 * 1_000);
  return {
    name: '',
    slug: '',
    type: 'FIXED_PRICE' as PromotionType,
    value: '',
    startsAt: toDateTimeLocal(now),
    endsAt: toDateTimeLocal(end),
    productIds: [] as string[],
    branchIds: [] as string[]
  };
}
function promotionInput(form: ReturnType<typeof emptyPromotionForm>) {
  return {
    name: form.name,
    slug: form.slug,
    description: null,
    promotionType: form.type,
    promoPrice: form.type === 'FIXED_PRICE' ? form.value : null,
    discountPercent: form.type === 'PERCENTAGE' ? form.value : null,
    discountAmount: form.type === 'FIXED_DISCOUNT' ? form.value : null,
    startsAt: new Date(form.startsAt).toISOString(),
    endsAt: new Date(form.endsAt).toISOString(),
    active: true,
    imageUrl: null,
    productIds: form.productIds,
    branchIds: form.branchIds
  };
}
function slugify(value: string): string {
  return value
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
function toggleId<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}
function showError(setNotice: (notice: Notice) => void) {
  return (reason: unknown) =>
    setNotice({
      kind: 'error',
      message: reason instanceof Error ? reason.message : 'No fue posible completar la operación.'
    });
}
function toDateTimeLocal(value: Date): string {
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}
