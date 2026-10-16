import { describe, expect, it } from 'vitest';
import { buildDashboardInsights, dashboardWindow, type DashboardRow } from './dashboard-insights';
const branch = { id: '00000000-0000-4000-8000-000000000001', name: 'Centro' };
const now = new Date('2026-10-09T03:59:59.000Z'); // Still October 8 in Bolivia.
function row(values: Partial<DashboardRow>): DashboardRow {
  return {
    date: '2026-10-08',
    branchId: branch.id,
    status: 'COMPLETED',
    type: 'PICKUP',
    orders: 1,
    amount: '0.10',
    ...values
  };
}
describe('executive dashboard definitions', () => {
  it('uses Bolivian calendar boundaries and handles month/year changes', () => {
    const period = dashboardWindow(7, now);
    expect(period.start.toISOString()).toBe('2026-10-02T04:00:00.000Z');
    expect(period.previousStart.toISOString()).toBe('2026-09-25T04:00:00.000Z');
    expect(period.period.to).toBe('2026-10-08');
    expect(dashboardWindow(7, new Date('2026-01-01T04:00:00Z')).period.from).toBe('2025-12-26');
    expect(dashboardWindow(7, new Date('2026-10-09T04:00:00Z')).period.to).toBe('2026-10-09');
  });
  it('preserves decimal precision and excludes cancelled amounts and their ticket denominator', () => {
    const data = buildDashboardInsights(
      [
        row({}),
        row({ amount: '0.20', status: 'RECEIVED', type: 'DELIVERY' }),
        row({ orders: 2, amount: '999.00', status: 'CANCELLED' }),
        row({ date: '2026-10-01', amount: '80.00' }),
        row({ date: '2026-09-01', amount: '800.00' })
      ],
      [branch],
      { days: 7 },
      now
    );
    expect(data.current).toEqual({
      orders: 4,
      amount: '0.30',
      averageTicket: '0.15',
      completed: 1,
      cancelled: 2,
      pending: 1
    });
    expect(data.previous.amount).toBe('80.00');
    expect(data.daily).toHaveLength(7);
    expect(data.daily[0]).toEqual({ date: '2026-10-02', orders: 0, amount: '0.00' });
    expect(data.daily[6]).toEqual({ date: '2026-10-08', orders: 4, amount: '0.30' });
    expect(data.byBranch[0]?.amount).toBe('0.30');
    expect(data.channels.map((c) => c.orders)).toEqual([3, 1]);
  });
  it('returns explicit zeroes for an empty scope and an all-cancelled period', () => {
    expect(buildDashboardInsights([], [], { days: 30 }, now).current.averageTicket).toBe('0.00');
    const data = buildDashboardInsights([row({ status: 'CANCELLED' })], [branch], { days: 7 }, now);
    expect(data.current.averageTicket).toBe('0.00');
    expect(data.current.amount).toBe('0.00');
    expect(data.current.orders).toBe(1);
  });
});
