import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { dashboardInsightsSchema, type DashboardQuery } from '@brasa-viva/contracts';
import type { AdminPrincipal } from '../../auth/domain/admin-policy';
import { buildDashboardInsights, dashboardWindow } from '../domain/dashboard-insights';
import { DashboardRepository } from '../infrastructure/dashboard.repository';

@Injectable()
export class DashboardService {
  constructor(@Inject(DashboardRepository) private readonly repository: DashboardRepository) {}
  async getInsights(principal: AdminPrincipal, query: DashboardQuery) {
    const global = principal.roles.some((role) => role === 'OWNER' || role === 'ADMIN');
    // Reject a forged branch filter before any data retrieval.
    if (query.branchId && !global && !principal.branchIds.includes(query.branchId))
      throw new ForbiddenException({
        code: 'ADMIN_BRANCH_FORBIDDEN',
        message: 'No tienes acceso a esta sucursal.'
      });
    const branches = await this.repository.listBranches(global ? undefined : principal.branchIds);
    if (query.branchId && !branches.some((branch) => branch.id === query.branchId))
      throw new ForbiddenException({
        code: 'ADMIN_BRANCH_FORBIDDEN',
        message: 'Esta sucursal no está disponible para tu cuenta.'
      });
    const now = new Date();
    const scope = query.branchId ? [query.branchId] : branches.map((branch) => branch.id);
    const rows = await this.repository.aggregate(
      scope,
      dashboardWindow(query.days, now).previousStart,
      now
    );
    return dashboardInsightsSchema.parse(buildDashboardInsights(rows, branches, query, now));
  }
}
