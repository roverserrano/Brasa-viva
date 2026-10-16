import { describe, expect, it, vi } from 'vitest';
import { DashboardRepository, dashboardAggregateSql } from './dashboard.repository';
import type { PrismaService } from '../../../database/prisma.service';
describe('dashboard SQL boundaries', () => {
  it('binds dates and branch IDs and excludes soft-deleted orders', () => {
    const malicious = "id' OR TRUE --";
    const from = new Date('2026-10-01T04:00:00Z');
    const until = new Date('2026-10-09T12:00:00Z');
    const sql = dashboardAggregateSql([malicious], from, until);
    expect(sql.text).not.toContain(malicious);
    expect(sql.values).toEqual([from, until, malicious]);
    expect(sql.text).toContain('o.deleted_at IS NULL');
    expect(sql.text).toContain("AT TIME ZONE 'America/La_Paz'");
    expect(sql.text).toContain('GROUP BY');
  });
  it('never queries all orders for an empty branch scope', async () => {
    const prisma = { $queryRaw: vi.fn() };
    const repository = new DashboardRepository(prisma as unknown as PrismaService);
    expect(await repository.aggregate([], new Date(), new Date())).toEqual([]);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    expect(dashboardAggregateSql([], new Date(), new Date()).text).toContain('AND FALSE');
  });
});
