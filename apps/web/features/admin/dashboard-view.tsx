'use client';
import type { DashboardInsights, DashboardQuery } from '@brasa-viva/contracts';
import { DashboardOverview } from './dashboard-overview';
import { AdminIcon } from './admin-icon';
import { formatDashboardDate } from './dashboard-format';
export function DashboardView({
  fullName,
  days,
  branchId,
  data,
  loading,
  error,
  setDays,
  setBranchId,
  onRefresh,
  canEditCatalog
}: {
  fullName: string;
  days: DashboardQuery['days'];
  branchId: string;
  data: DashboardInsights | null;
  loading: boolean;
  error: string | null;
  setDays: (days: DashboardQuery['days']) => void;
  setBranchId: (id: string) => void;
  onRefresh: () => void;
  canEditCatalog: boolean;
}) {
  // Never present old metrics under newly selected filters, including the render before the effect.
  const matches = data?.period.days === days && data.branchId === (branchId || null);
  return (
    <section className="dashboard-page admin-page-stack">
      <header className="dashboard-heading">
        <div>
          <p className="admin-eyebrow">VISIÓN EJECUTIVA</p>
          <h1>
            Tu negocio, de un vistazo<span>.</span>
          </h1>
          <p>Hola, {fullName.split(' ')[0]}. Cada decisión empieza con información clara.</p>
        </div>
        <button
          className="admin-secondary-button dashboard-refresh"
          type="button"
          disabled={loading}
          onClick={onRefresh}
        >
          <AdminIcon name="refresh" />
          {loading ? 'Actualizando…' : 'Actualizar'}
        </button>
      </header>
      <div className="dashboard-toolbar">
        <div className="dashboard-filters">
          <label>
            Período
            <select
              value={days}
              onChange={(event) => setDays(Number(event.target.value) as DashboardQuery['days'])}
            >
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
            </select>
          </label>
          <label>
            Sucursal
            <select value={branchId} onChange={(event) => setBranchId(event.target.value)}>
              <option value="">Todas las autorizadas</option>
              {data?.branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="dashboard-update">
          {matches && data ? (
            <>
              <span>
                {formatDashboardDate(data.period.from)} — {formatDashboardDate(data.period.to)}
              </span>
              <small>
                Actualizado{' '}
                {new Intl.DateTimeFormat('es-BO', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'America/La_Paz'
                }).format(new Date(data.generatedAt))}{' '}
                · Bolivia
              </small>
            </>
          ) : (
            'Hora de Bolivia · incluye hoy'
          )}
        </p>
      </div>
      {error ? (
        <div className="admin-error dashboard-error" role="alert">
          <strong>No pudimos actualizar el dashboard</strong>
          <p>{error}</p>
          <button type="button" className="admin-secondary-button" onClick={onRefresh}>
            Intentar nuevamente
          </button>
        </div>
      ) : null}
      {loading || (!matches && !error) ? (
        <div className="dashboard-loading" role="status">
          <span className="dashboard-loading-dot" /> Preparando los indicadores de tu negocio…
          <div className="dashboard-skeletons" aria-hidden="true">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} />
            ))}
          </div>
        </div>
      ) : !error && matches && data ? (
        <DashboardOverview
          data={data}
          onBranchChange={setBranchId}
          canEditCatalog={canEditCatalog}
        />
      ) : null}
      <p className="dashboard-footnote">
        Información basada en pedidos registrados. Los importes no equivalen a cobros confirmados.
      </p>
    </section>
  );
}
