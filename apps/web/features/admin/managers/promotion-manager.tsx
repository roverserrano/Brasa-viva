'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { type AdminProductResponse, type AdminPromotionResponse } from '@brasa-viva/contracts';
import {
  createAdminPromotion,
  getAdminProductOptions,
  getAdminPromotions,
  updateAdminPromotion
} from '../../../lib/admin-api';
import { getBranches } from '../../../lib/api';
import { AdminForm } from '../admin-form';
import {
  ManagerLayout,
  emptyPromotionForm,
  promotionInput,
  slugify,
  toggleId,
  showError,
  toDateTimeLocal,
  type Notice,
  type BranchOption,
  type PromotionType
} from './shared';

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
