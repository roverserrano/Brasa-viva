'use client';

import { useEffect, useState } from 'react';
import {
  orderStatusLabels,
  orderTypeLabels,
  permittedOrderTransitions,
  type OrderStatus
} from '@brasa-viva/contracts';
import { getAdminOrders, updateAdminOrderStatus } from '../../../lib/admin-api';
import { formatBs } from '../../../lib/format';
import { ManagerLayout, showError, type Notice } from './shared';

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
                      <p>{orderTypeLabels[order.orderType]}</p>
                      <ul>
                        {order.items.map((item) => (
                          <li key={item.id}>
                            {item.quantity} × {item.productName} — {formatBs(item.lineTotal)}
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
                  <td data-label="Total">{formatBs(order.total)}</td>
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
