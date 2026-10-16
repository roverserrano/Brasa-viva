import type { DashboardInsights, DashboardQuery } from '@brasa-viva/contracts';

/** Synthetic data for browser tests and design previews only; never imported by application code. */
export function dashboardFixture(
  days: DashboardQuery['days'] = 30,
  branchId: string | null = null
): DashboardInsights {
  const branches = [
    { id: '00000000-0000-4000-8000-000000000001', name: 'Brasa Viva Centro' },
    { id: '00000000-0000-4000-8000-000000000007', name: 'Brasa Viva Norte' },
    { id: '00000000-0000-4000-8000-000000000008', name: 'Brasa Viva Sur' }
  ];
  const end = Date.parse('2026-10-09T12:00:00Z');
  const date = (offset: number) => new Date(end + offset * 86400000).toISOString().slice(0, 10);
  const daily = Array.from({ length: days }, (_, i) => {
    const orders = 10 + ((i * 7) % 19) + (branchId ? 0 : 10);
    return { date: date(i - days + 1), orders, amount: ((orders - 2) * 45).toFixed(2) };
  });
  const orders = daily.reduce((sum, day) => sum + day.orders, 0);
  const amount = daily.reduce((sum, day) => sum + Number(day.amount), 0).toFixed(2);
  const current = {
    orders,
    amount,
    averageTicket: '45.00',
    pending: days * 5,
    cancelled: days * 2,
    completed: orders - days * 7
  };
  const selected = branchId ? branches.filter((b) => b.id === branchId) : branches;
  const counts = [Math.floor(orders * 0.5), Math.floor(orders * 0.3)];
  const amounts = [Math.floor(Number(amount) * 0.5), Math.floor(Number(amount) * 0.3)];
  return {
    generatedAt: '2026-10-09T18:35:00.000Z',
    period: {
      days,
      from: date(1 - days),
      to: date(0),
      previousFrom: date(1 - days * 2),
      previousTo: date(-days),
      timezone: 'America/La_Paz'
    },
    branchId,
    branches,
    current,
    previous: {
      orders: 500,
      amount: '19350.00',
      averageTicket: '43.00',
      completed: 400,
      cancelled: 50,
      pending: 50
    },
    daily,
    statuses: [
      { status: 'RECEIVED', orders: days },
      { status: 'CONFIRMED', orders: days * 2 },
      { status: 'PREPARING', orders: days },
      { status: 'READY', orders: days },
      { status: 'COMPLETED', orders: current.completed },
      { status: 'CANCELLED', orders: current.cancelled }
    ],
    channels: [
      { type: 'PICKUP', orders: Math.floor(orders * 0.6) },
      { type: 'DELIVERY', orders: orders - Math.floor(orders * 0.6) }
    ],
    byBranch: selected.map((branch, i) => ({
      ...branch,
      orders: branchId ? orders : (counts[i] ?? orders - counts[0]! - counts[1]!),
      amount: branchId
        ? amount
        : (amounts[i] ?? Number(amount) - amounts[0]! - amounts[1]!).toFixed(2)
    }))
  };
}
