import { Inject, Injectable } from '@nestjs/common';
import {
  StockStatus,
  type BranchProduct,
  type Category,
  type Product,
  type ProductImage
} from '../../../../generated/prisma/client';
import { PrismaService } from '../../../database/prisma.service';

type BranchProductWithProduct = BranchProduct & {
  product: Product & { images: ProductImage[] };
};

type BranchProductWithProductAndCategory = BranchProduct & {
  product: Product & { category: Category; images: ProductImage[] };
};

@Injectable()
export class ProductsRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAvailableForBranch(branchId: string): Promise<BranchProductWithProduct[]> {
    return this.prisma.branchProduct.findMany({
      where: {
        branchId,
        available: true,
        stockStatus: { not: StockStatus.OUT_OF_STOCK },
        deletedAt: null,
        product: {
          active: true,
          deletedAt: null,
          category: {
            active: true,
            deletedAt: null
          }
        }
      },
      include: {
        product: {
          include: {
            images: {
              where: { deletedAt: null, isPrimary: true },
              orderBy: { displayOrder: 'asc' },
              take: 1
            }
          }
        }
      },
      orderBy: [{ product: { category: { displayOrder: 'asc' } } }, { product: { name: 'asc' } }]
    });
  }

  async findAvailableProductForBranch(
    branchId: string,
    productSlug: string
  ): Promise<BranchProductWithProductAndCategory | null> {
    return this.prisma.branchProduct.findFirst({
      where: {
        branchId,
        available: true,
        stockStatus: { not: StockStatus.OUT_OF_STOCK },
        deletedAt: null,
        product: {
          slug: productSlug,
          active: true,
          deletedAt: null,
          category: {
            active: true,
            deletedAt: null
          }
        }
      },
      include: {
        product: {
          include: {
            category: true,
            images: {
              where: { deletedAt: null, isPrimary: true },
              orderBy: { displayOrder: 'asc' },
              take: 1
            }
          }
        }
      }
    });
  }
}
