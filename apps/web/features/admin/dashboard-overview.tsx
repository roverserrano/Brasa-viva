'use client';
import Link from 'next/link';
import { orderStatusLabels, type DashboardInsights } from '@brasa-viva/contracts';
import { AdminIcon, type AdminIconName } from './admin-icon';
import { DashboardChart } from './dashboard-chart';
import {
  comparisonLabel,
  formatBolivianos,
  formatCount,
  formatDashboardDate
} from './dashboard-format';
const statusColors = ['#d58a2a', '#4d85a0', '#7465ad', '#47a594', '#187564', '#a9676a'];
export function DashboardOverview({
  data,
  onBranchChange,
  canEditCatalog
}: {
  data: DashboardInsights;
  onBranchChange: (id: string) => void;
  canEditCatalog: boolean;
}) {
  const { current, previous } = data;
  let angle = 0;
  const segments = data.statuses.map((status, i) => {
    const start = angle;
    angle += current.orders ? (status.orders / current.orders) * 100 : 0;
    return `${statusColors[i]} ${start}% ${angle}%`;
  });
  const branchMax = Math.max(...data.byBranch.map((branch) => Number(branch.amount)), 1);
  return (
    <>
      <div className="executive-metrics" aria-label="Indicadores del período">
        <Metric
          label="Importe de pedidos"
          value={formatBolivianos(current.amount)}
          detail="Excluye pedidos cancelados"
          compare={comparisonLabel(Number(current.amount), Number(previous.amount))}
          icon="wallet"
          featured
        />
        <Metric
          label="Pedidos registrados"
          value={formatCount(current.orders)}
          detail="Incluye todos los estados"
          compare={comparisonLabel(current.orders, previous.orders)}
          icon="orders"
        />
        <Metric
          label="Ticket promedio"
          value={formatBolivianos(current.averageTicket)}
          detail="Por pedido no cancelado"
          compare={comparisonLabel(Number(current.averageTicket), Number(previous.averageTicket))}
          icon="trend"
        />
        <Metric
          label="En atención"
          value={formatCount(current.pending)}
          detail="Pendientes del período elegido"
          compare={`${formatCount(current.completed)} entregados · ${formatCount(current.cancelled)} cancelados`}
          icon="clock"
        />
      </div>
      {current.orders === 0 ? (
        <div className="dashboard-empty" role="status">
          <AdminIcon name="dashboard" />
          <div>
            <strong>Aquí empieza la historia de tu negocio.</strong>
            <p>No hay pedidos en este período y alcance. Prueba otra fecha o sucursal.</p>
          </div>
        </div>
      ) : null}
      <div className="dashboard-main-grid">
        <DashboardChart key={`${data.period.from}-${data.branchId}`} daily={data.daily} />
        <section className="executive-card dashboard-statuses">
          <div className="dashboard-panel-heading">
            <div>
              <p className="dashboard-kicker">OPERACIÓN</p>
              <h2>Estado de los pedidos</h2>
            </div>
            <AdminIcon name="orders" />
          </div>
          <div
            className="dashboard-donut"
            style={{
              background: current.orders ? `conic-gradient(${segments.join(',')})` : '#e8edef'
            }}
            aria-hidden="true"
          >
            <div>
              <strong>{formatCount(current.orders)}</strong>
              <span>pedidos</span>
            </div>
          </div>
          <ul className="dashboard-status-list">
            {data.statuses.map((status, i) => (
              <li key={status.status}>
                <span>
                  <i style={{ background: statusColors[i] }} />
                  {orderStatusLabels[status.status]}
                </span>
                <strong>{formatCount(status.orders)}</strong>
                <small>
                  {current.orders ? Math.round((status.orders / current.orders) * 100) : 0}%
                </small>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="dashboard-bottom-grid">
        <section className="executive-card">
          <div className="dashboard-panel-heading">
            <div>
              <p className="dashboard-kicker">RED BRASA VIVA</p>
              <h2>Desempeño por sucursal</h2>
            </div>
            <span className="dashboard-subtle">Importe registrado</span>
          </div>
          <p className="dashboard-subtle">Selecciona una sucursal para explorar sus indicadores.</p>
          <div className="dashboard-branch-list">
            {data.byBranch.length ? (
              data.byBranch.map((branch, index) => (
                <button
                  key={branch.id}
                  type="button"
                  className="dashboard-branch"
                  onClick={() => onBranchChange(branch.id)}
                  aria-label={`Ver indicadores de ${branch.name}`}
                >
                  <span className="dashboard-rank">{String(index + 1).padStart(2, '0')}</span>
                  <span className="dashboard-branch-info">
                    <strong>{branch.name}</strong>
                    <span className="dashboard-branch-track">
                      <span style={{ width: `${(Number(branch.amount) / branchMax) * 100}%` }} />
                    </span>
                    <small>{formatCount(branch.orders)} pedidos</small>
                  </span>
                  <span className="dashboard-branch-value">
                    {formatBolivianos(branch.amount)}
                    <AdminIcon name="arrow" />
                  </span>
                </button>
              ))
            ) : (
              <p>No tienes sucursales disponibles en tu alcance.</p>
            )}
          </div>
        </section>
        <section className="executive-card dashboard-channels">
          <div className="dashboard-panel-heading">
            <div>
              <p className="dashboard-kicker">PREFERENCIAS DE PEDIDO</p>
              <h2>¿Cómo nos eligen?</h2>
            </div>
          </div>
          {data.channels.map((channel) => (
            <div className="dashboard-channel" key={channel.type}>
              <span className="dashboard-channel-icon">
                <AdminIcon name={channel.type === 'PICKUP' ? 'branches' : 'products'} />
              </span>
              <div>
                <strong>
                  {channel.type === 'PICKUP' ? 'Recojo en sucursal' : 'Delivery coordinado'}
                </strong>
                <small>
                  {formatCount(channel.orders)} pedidos ·{' '}
                  {current.orders ? Math.round((channel.orders / current.orders) * 100) : 0}%
                </small>
              </div>
            </div>
          ))}
          <div className="dashboard-next-action">
            <strong>De la información a la acción</strong>
            <p>Revisa la operación y acompaña cada pedido.</p>
            <Link href="/admin/pedidos">
              Atender pedidos <AdminIcon name="arrow" />
            </Link>
            {canEditCatalog ? (
              <Link href="/admin/productos">
                Gestionar el catálogo <AdminIcon name="arrow" />
              </Link>
            ) : null}
          </div>
        </section>
      </div>
      <details className="dashboard-definitions">
        <summary>Cómo leer estos indicadores</summary>
        <p>
          Se agrupan por fecha de creación del pedido y su estado actual. El importe y ticket
          excluyen cancelados; no representan ingresos cobrados ni utilidad. La distribución de
          estados y modalidades incluye todos los pedidos.
        </p>
        <p>
          Período: {formatDashboardDate(data.period.from)} – {formatDashboardDate(data.period.to)}{' '}
          (hoy parcial). Comparación: {formatDashboardDate(data.period.previousFrom)} –{' '}
          {formatDashboardDate(data.period.previousTo)}, días completos. Hora de Bolivia. «En
          atención» solo incluye pedidos creados en el período elegido; revisa Pedidos para la
          operación completa.
        </p>
      </details>
    </>
  );
}
function Metric({
  label,
  value,
  detail,
  compare,
  icon,
  featured
}: {
  label: string;
  value: string;
  detail: string;
  compare: string;
  icon: AdminIconName;
  featured?: boolean;
}) {
  return (
    <article className={`executive-metric ${featured ? 'executive-metric-featured' : ''}`}>
      <div>
        <span>{label}</span>
        <span className="executive-metric-icon">
          <AdminIcon name={icon} />
        </span>
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
      <small>{compare}</small>
    </article>
  );
}
