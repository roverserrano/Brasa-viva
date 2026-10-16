import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminService } from './application/admin.service';
import { AdminController } from './admin.controller';
import { AdminRepository } from './infrastructure/admin.repository';
import { DashboardRepository } from './infrastructure/dashboard.repository';
import { DashboardService } from './application/dashboard.service';

@Module({
  imports: [AuthModule],
  controllers: [AdminController],
  providers: [AdminService, AdminRepository, DashboardService, DashboardRepository]
})
export class AdminModule {}
