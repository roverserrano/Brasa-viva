import { z } from 'zod';
// Aggregate response amounts are already normalized, and can exceed a single order's limit.
const moneySchema = z
  .string()
  .max(40)
  .regex(/^\d+\.\d{2}$/);
import { orderStatusSchema, orderTypeSchema } from './orders';

export const dashboardQuerySchema = z.object({
  days: z.coerce
    .number()
    .pipe(z.union([z.literal(7), z.literal(30), z.literal(90)]))
    .default(30),
  branchId: z.uuid().optional()
});
const summarySchema = z.object({
  orders: z.int().nonnegative(),
  amount: moneySchema,
  averageTicket: moneySchema,
  completed: z.int().nonnegative(),
  cancelled: z.int().nonnegative(),
  pending: z.int().nonnegative()
});
export const dashboardInsightsSchema = z.object({
  generatedAt: z.iso.datetime(),
  period: z.object({
    days: z.union([z.literal(7), z.literal(30), z.literal(90)]),
    from: z.iso.date(),
    to: z.iso.date(),
    previousFrom: z.iso.date(),
    previousTo: z.iso.date(),
    timezone: z.literal('America/La_Paz')
  }),
  branchId: z.uuid().nullable(),
  branches: z.array(z.object({ id: z.uuid(), name: z.string().min(1) })),
  current: summarySchema,
  previous: summarySchema,
  daily: z.array(
    z.object({ date: z.iso.date(), orders: z.int().nonnegative(), amount: moneySchema })
  ),
  statuses: z.array(z.object({ status: orderStatusSchema, orders: z.int().nonnegative() })),
  channels: z.array(z.object({ type: orderTypeSchema, orders: z.int().nonnegative() })),
  byBranch: z.array(
    z.object({
      id: z.uuid(),
      name: z.string().min(1),
      orders: z.int().nonnegative(),
      amount: moneySchema
    })
  )
});
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
export type DashboardInsights = z.infer<typeof dashboardInsightsSchema>;
