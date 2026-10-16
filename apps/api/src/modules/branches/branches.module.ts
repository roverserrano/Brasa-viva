import { Module } from '@nestjs/common';
import { BranchesService } from './application/branches.service';
import { BranchesController } from './branches.controller';
import { BranchesRepository } from './infrastructure/branches.repository';

@Module({
  controllers: [BranchesController],
  providers: [BranchesService, BranchesRepository],
  exports: [BranchesService]
})
export class BranchesModule {}
