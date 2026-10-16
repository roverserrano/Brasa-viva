import { Module } from '@nestjs/common';
import { BranchesModule } from '../branches/branches.module';
import { ProductsService } from './application/products.service';
import { ProductsController, PublicProductsController } from './products.controller';
import { ProductsRepository } from './infrastructure/products.repository';

@Module({
  imports: [BranchesModule],
  controllers: [ProductsController, PublicProductsController],
  providers: [ProductsService, ProductsRepository]
})
export class ProductsModule {}
