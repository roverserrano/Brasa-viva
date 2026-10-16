import type { CalculatedOrder } from './order-pricing';

type WhatsAppOrder = Pick<CalculatedOrder, 'lines' | 'total'> & {
  orderCode: string;
  branchName: string;
  customerName: string;
  orderType: 'PICKUP' | 'DELIVERY';
  deliveryAddress: string | null;
  notes: string | null;
};

export function buildWhatsAppUrl(whatsapp: string | null, order: WhatsAppOrder): string | null {
  const recipient = whatsapp?.replace(/\D/g, '');

  if (!recipient || recipient.length < 7) {
    return null;
  }

  const orderType = order.orderType === 'PICKUP' ? 'Recojo en sucursal' : 'Delivery coordinado';
  const items = order.lines.map((item) => `- ${item.quantity} × ${item.productName}: Bs ${item.lineTotal}`);
  const message = [
    `Pedido ${order.orderCode}`,
    `Sucursal: ${order.branchName}`,
    `Tipo: ${orderType}`,
    `Cliente: ${order.customerName}`,
    ...items,
    `Total confirmado: Bs ${order.total}`,
    ...(order.deliveryAddress ? [`Dirección: ${order.deliveryAddress}`] : []),
    ...(order.notes ? [`Notas: ${order.notes}`] : [])
  ].join('\n');

  return `https://wa.me/${recipient}?text=${encodeURIComponent(message)}`;
}
