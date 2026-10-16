import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../database/prisma.service';
import { BranchesController } from './branches/branches.controller';
import { BranchesService } from './branches/application/branches.service';
import { BranchesRepository } from './branches/infrastructure/branches.repository';
import { CategoriesController } from './categories/categories.controller';
import { CategoriesService } from './categories/application/categories.service';
import { CategoriesRepository } from './categories/infrastructure/categories.repository';
import { ProductsController, PublicProductsController } from './products/products.controller';
import { ProductsService } from './products/application/products.service';
import { ProductsRepository } from './products/infrastructure/products.repository';
import { PromotionsController } from './promotions/promotions.controller';
import { PromotionsService } from './promotions/application/promotions.service';
import { PromotionsRepository } from './promotions/infrastructure/promotions.repository';

const branch = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Brasa Viva Centro',
  slug: 'brasa-viva-centro',
  addressLine: 'Av. Heroínas, Cochabamba',
  whatsapp: '59170000001'
};

describe('public API dependency injection', () => {
  let module: TestingModule;

  beforeEach(async () => {
    const prisma = {
      branch: {
        findMany: vi.fn().mockResolvedValue([branch]),
        findFirst: vi.fn().mockResolvedValue(branch)
      },
      branchProduct: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null)
      },
      category: {
        findMany: vi.fn().mockResolvedValue([])
      },
      promotion: {
        findMany: vi.fn().mockResolvedValue([])
      }
    };

    module = await Test.createTestingModule({
      controllers: [
        BranchesController,
        CategoriesController,
        ProductsController,
        PublicProductsController,
        PromotionsController
      ],
      providers: [
        BranchesService,
        BranchesRepository,
        CategoriesService,
        CategoriesRepository,
        ProductsService,
        ProductsRepository,
        PromotionsService,
        PromotionsRepository,
        { provide: PrismaService, useValue: prisma }
      ]
    }).compile();
  });

  it('resolves each public controller and its service-repository chain', async () => {
    await expect(module.get(BranchesController).listPublic()).resolves.toEqual([
      {
        id: branch.id,
        name: branch.name,
        slug: branch.slug,
        address: branch.addressLine,
        whatsapp: branch.whatsapp,
        active: true
      }
    ]);
    await expect(module.get(CategoriesController).listPublic()).resolves.toEqual([]);
    await expect(module.get(ProductsController).getMenuForBranch(branch.slug)).resolves.toMatchObject({
      branch: { id: branch.id },
      products: []
    });
    await expect(module.get(PublicProductsController).listForBranch(branch.slug)).resolves.toMatchObject({
      branch: { id: branch.id },
      products: []
    });
    await expect(module.get(PromotionsController).listActive()).resolves.toEqual([]);
  });
});
