import {
  orderStatusSchema,
  orderTypeSchema,
  type DashboardQuery,
  type DashboardInsights
} from '@brasa-viva/contracts';
import { Prisma } from '../../../../generated/prisma/client';

export type DashboardRow = {
  date: string;
  branchId: string;
  status: DashboardInsights['statuses'][number]['status'];
  type: DashboardInsights['channels'][number]['type'];
  orders: number;
  amount: string;
};
const dayMs = 86_400_000;
export function dashboardWindow(days: DashboardQuery['days'], now: Date) {
  // Bolivia uses UTC-04 year-round. Calendar days are independent of the server timezone.
  const date = new Date(now.getTime() - 4 * 3_600_000).toISOString().slice(0, 10);
  const today = new Date(`${date}T00:00:00-04:00`);
  const start = new Date(today.getTime() - (days - 1) * dayMs);
  const previousStart = new Date(start.getTime() - days * dayMs);
  const dateOf = (value: Date) =>
    new Date(value.getTime() - 4 * 3_600_000).toISOString().slice(0, 10);
  return {
    start,
    previousStart,
    period: {
      days,
      from: dateOf(start),
      to: date,
      previousFrom: dateOf(previousStart),
      previousTo: dateOf(new Date(start.getTime() - dayMs)),
      timezone: 'America/La_Paz' as const
    }
  };
}
export function buildDashboardInsights(
  rows: DashboardRow[],
  branches: DashboardInsights['branches'],
  query: DashboardQuery,
  now: Date
): DashboardInsights {
  const { start, period } = dashboardWindow(query.days, now);
  const currentRows = rows.filter((row) => row.date >= period.from && row.date <= period.to);
  const previousRows = rows.filter(
    (row) => row.date >= period.previousFrom && row.date < period.from
  );
  const sum = (values: DashboardRow[]) => values.reduce((count, row) => count + row.orders, 0);
  const amount = (values: DashboardRow[]) =>
    values
      .filter((row) => row.status !== 'CANCELLED')
      .reduce((total, row) => total.add(row.amount), new Prisma.Decimal(0));
  const summary = (values: DashboardRow[]) => {
    const eligible = sum(values.filter((row) => row.status !== 'CANCELLED'));
    return {
      orders: sum(values),
      amount: amount(values).toFixed(2),
      averageTicket: eligible ? amount(values).div(eligible).toFixed(2) : '0.00',
      completed: sum(values.filter((row) => row.status === 'COMPLETED')),
      cancelled: sum(values.filter((row) => row.status === 'CANCELLED')),
      pending: sum(values.filter((row) => !['COMPLETED', 'CANCELLED'].includes(row.status)))
    };
  };
  return {
    generatedAt: now.toISOString(),
    period,
    branchId: query.branchId ?? null,
    branches,
    current: summary(currentRows),
    previous: summary(previousRows),
    daily: Array.from({ length: query.days }, (_, index) => {
      const date = new Date(start.getTime() + index * dayMs).toISOString().slice(0, 10);
      const values = currentRows.filter((row) => row.date === date);
      return { date, orders: sum(values), amount: amount(values).toFixed(2) };
    }),
    statuses: orderStatusSchema.options.map((status) => ({
      status,
      orders: sum(currentRows.filter((row) => row.status === status))
    })),
    channels: orderTypeSchema.options.map((type) => ({
      type,
      orders: sum(currentRows.filter((row) => row.type === type))
    })),
    byBranch: branches
      .filter((branch) => !query.branchId || branch.id === query.branchId)
      .map((branch) => {
        const values = currentRows.filter((row) => row.branchId === branch.id);
        return { ...branch, orders: sum(values), amount: amount(values).toFixed(2) };
      })
      .sort((a, b) => new Prisma.Decimal(b.amount).comparedTo(a.amount) || b.orders - a.orders)
  };
}
