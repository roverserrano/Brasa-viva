'use client';
import { useState } from 'react';
import type { DashboardInsights } from '@brasa-viva/contracts';
import { formatBolivianos, formatCount, formatDashboardDate } from './dashboard-format';

export function DashboardChart({ daily }: { daily: DashboardInsights['daily'] }) {
  const [metric, setMetric] = useState<'orders' | 'amount'>('orders');
  const [selected, setSelected] = useState(daily.length - 1);
  const index = Math.min(selected, daily.length - 1);
  const active = daily[index];
  const values = daily.map((day) => Number(day[metric]));
  const max = Math.max(...values, 1);
  const points = values.map((value, i) => ({
    x: 32 + (i / Math.max(values.length - 1, 1)) * 676,
    y: 202 - (value / max) * 164
  }));
  const line = points.map((point) => `${point.x},${point.y}`).join(' ');
  const display = (value: number) =>
    metric === 'orders' ? formatCount(value) : formatBolivianos(value);
  return (
    <section className="executive-card dashboard-evolution">
      <div className="dashboard-panel-heading">
        <div>
          <p className="dashboard-kicker">PULSO DEL NEGOCIO</p>
          <h2>Evolución diaria</h2>
        </div>
        <div className="dashboard-segment" role="group" aria-label="Métrica del gráfico">
          <button
            type="button"
            aria-pressed={metric === 'orders'}
            onClick={() => setMetric('orders')}
          >
            Pedidos
          </button>
          <button
            type="button"
            aria-pressed={metric === 'amount'}
            onClick={() => setMetric('amount')}
          >
            Importe
          </button>
        </div>
      </div>
      {active ? (
        <>
          <div className="dashboard-chart-summary" aria-live="polite">
            <strong>{display(values[index] ?? 0)}</strong>
            <span>
              {metric === 'orders' ? 'pedidos' : 'sin cancelados'} ·{' '}
              {formatDashboardDate(active.date)}
            </span>
          </div>
          <figure className="dashboard-chart">
            <svg
              viewBox="0 0 740 228"
              role="img"
              aria-label={`Evolución de ${metric === 'orders' ? 'pedidos' : 'importes'} por día. Consulta los valores en la tabla de datos.`}
            >
              <defs>
                <linearGradient id="dashboard-area" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#16816e" stopOpacity=".2" />
                  <stop offset="100%" stopColor="#16816e" stopOpacity=".015" />
                </linearGradient>
              </defs>
              {[38, 93, 148, 202].map((y) => (
                <line
                  key={y}
                  x1="32"
                  x2="708"
                  y1={y}
                  y2={y}
                  stroke="#e5ebed"
                  strokeDasharray="4 5"
                />
              ))}
              <polygon points={`32,202 ${line} 708,202`} fill="url(#dashboard-area)" />
              <polyline
                points={line}
                stroke="#16816e"
                strokeWidth="3"
                fill="none"
                strokeLinejoin="round"
              />
              {points[index] ? (
                <>
                  <line
                    x1={points[index].x}
                    x2={points[index].x}
                    y1="30"
                    y2="202"
                    stroke="#8fa8a0"
                    strokeDasharray="4 4"
                  />
                  <circle
                    cx={points[index].x}
                    cy={points[index].y}
                    r="5"
                    fill="#16816e"
                    stroke="white"
                    strokeWidth="3"
                  />
                </>
              ) : null}
              {points.map((point, i) => (
                <rect
                  key={daily[i]?.date}
                  x={point.x - 338 / values.length}
                  y="25"
                  width={676 / values.length}
                  height="180"
                  fill="transparent"
                  onMouseEnter={() => setSelected(i)}
                  onClick={() => setSelected(i)}
                  aria-hidden="true"
                />
              ))}
            </svg>
            <figcaption>
              <span>{formatDashboardDate(daily[0]!.date)}</span>
              <span>Máximo: {display(Math.max(...values))}</span>
              <span>{formatDashboardDate(daily[daily.length - 1]!.date)}</span>
            </figcaption>
          </figure>
          <label className="dashboard-day-picker">
            Explorar un día
            <input
              type="range"
              min="0"
              max={daily.length - 1}
              value={index}
              onChange={(event) => setSelected(Number(event.target.value))}
              aria-valuetext={`${formatDashboardDate(active.date)}: ${display(values[index] ?? 0)}`}
            />
          </label>
          <details className="dashboard-data-table">
            <summary>Ver tabla de datos</summary>
            <div className="admin-table-wrap">
              <table>
                <caption>Pedidos por fecha de creación · hora de Bolivia</caption>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Pedidos</th>
                    <th>Importe sin cancelados</th>
                  </tr>
                </thead>
                <tbody>
                  {daily.map((day) => (
                    <tr key={day.date}>
                      <td data-label="Fecha">{formatDashboardDate(day.date)}</td>
                      <td data-label="Pedidos">{formatCount(day.orders)}</td>
                      <td data-label="Importe">{formatBolivianos(day.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      ) : (
        <p>No hay datos para este período.</p>
      )}
    </section>
  );
}
