'use client';

import { useState, type ReactNode } from 'react';
import { type AdminBranchResponse, type AdminProductResponse } from '@brasa-viva/contracts';
import { canManageCatalog, useAdminSession } from '../admin-shell';
import { formatBs } from '../../../lib/format';

export type Notice = { kind: 'error' | 'success'; message: string } | null;
export type BranchOption = Pick<AdminBranchResponse, 'id' | 'name'>;
export type PromotionType = 'FIXED_PRICE' | 'PERCENTAGE' | 'FIXED_DISCOUNT' | 'BUNDLE';

export const roles = ['OWNER', 'ADMIN', 'BRANCH_MANAGER', 'EDITOR', 'OPERATOR'] as const;
export function BranchAssignments({
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
            : {assignment.available ? 'Disponible' : 'No disponible'} ·{' '}
            {formatBs(assignment.priceOverride ?? product.basePrice)}
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
              <small>Deja vacío para usar {formatBs(product.basePrice)} del catálogo.</small>
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

export function ManagerLayout({
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

export function emptyProductForm() {
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
export function emptyBranchForm() {
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
export function emptyPromotionForm() {
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
export function promotionInput(form: ReturnType<typeof emptyPromotionForm>) {
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
export function slugify(value: string): string {
  return value
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
export function toggleId<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}
export function showError(setNotice: (notice: Notice) => void) {
  return (reason: unknown) =>
    setNotice({
      kind: 'error',
      message: reason instanceof Error ? reason.message : 'No fue posible completar la operación.'
    });
}
export function toDateTimeLocal(value: Date): string {
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}
