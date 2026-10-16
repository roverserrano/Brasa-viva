import { Module } from '@nestjs/common';
import { BranchesModule } from '../branches/branches.module';
import { PromotionsService } from './application/promotions.service';
import { PromotionsController } from './promotions.controller';
import { PromotionsRepository } from './infrastructure/promotions.repository';

@Module({
  imports: [BranchesModule],
  controllers: [PromotionsController],
  providers: [PromotionsService, PromotionsRepository]
})
export class PromotionsModule {}
