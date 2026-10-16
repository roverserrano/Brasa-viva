import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { type DashboardRow } from '../domain/dashboard-insights';

/** Keep filtering and aggregation in PostgreSQL; never load the order history into Node. */
export function dashboardAggregateSql(branchIds: string[], from: Date, until: Date) {
  const scope = branchIds.length
    ? Prisma.sql`o.branch_id IN (${Prisma.join(branchIds.map((id) => Prisma.sql`${id}::uuid`))})`
    : Prisma.sql`FALSE`;
  return Prisma.sql`
    SELECT to_char(o.created_at AT TIME ZONE 'America/La_Paz', 'YYYY-MM-DD') AS date,
      o.branch_id::text AS "branchId", o.status::text AS status, o.order_type::text AS type,
      COUNT(*)::int AS orders, SUM(o.total)::text AS amount
    FROM orders o
    WHERE o.deleted_at IS NULL AND o.created_at >= ${from} AND o.created_at <= ${until}
      AND ${scope}
    GROUP BY 1, 2, 3, 4 ORDER BY 1`;
}
@Injectable()
export class DashboardRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  listBranches(scope?: string[]) {
    return this.prisma.branch.findMany({
      where: { deletedAt: null, ...(scope ? { id: { in: scope } } : {}) },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
  }
  aggregate(branchIds: string[], from: Date, until: Date): Promise<DashboardRow[]> {
    if (!branchIds.length) return Promise.resolve([]);
    return this.prisma.$queryRaw<DashboardRow[]>(dashboardAggregateSql(branchIds, from, until));
  }
}
