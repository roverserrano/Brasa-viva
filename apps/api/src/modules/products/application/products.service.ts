import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  catalogResponseSchema,
  productDetailResponseSchema,
  type CatalogResponse,
  type ProductDetailResponse,
  type ProductResponse
} from '@brasa-viva/contracts';
import { BranchesService } from '../../branches/application/branches.service';
import { ProductsRepository } from '../infrastructure/products.repository';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(BranchesService) private readonly branchesService: BranchesService,
    @Inject(ProductsRepository) private readonly productsRepository: ProductsRepository
  ) {}

  async getMenuForBranch(slug: string): Promise<CatalogResponse> {
    const branch = await this.branchesService.findActiveBySlug(slug);
    const branchProducts = await this.productsRepository.findAvailableForBranch(branch.id);

    return catalogResponseSchema.parse({
      branch: this.branchesService.toResponse(branch),
      products: branchProducts.map((branchProduct) => this.toProductResponse(branchProduct))
    });
  }

  async getProductForBranch(branchSlug: string, productSlug: string): Promise<ProductDetailResponse> {
    const branch = await this.branchesService.findActiveBySlug(branchSlug);
    const branchProduct = await this.productsRepository.findAvailableProductForBranch(
      branch.id,
      productSlug
    );

    if (!branchProduct) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_AVAILABLE',
        message: 'El producto no está disponible en esta sucursal.'
      });
    }

    return productDetailResponseSchema.parse({
      ...this.toProductResponse(branchProduct),
      branch: this.branchesService.toResponse(branch),
      category: {
        id: branchProduct.product.category.id,
        name: branchProduct.product.category.name,
        slug: branchProduct.product.category.slug,
        description: branchProduct.product.category.description
      }
    });
  }

  private toProductResponse(branchProduct: {
    available: boolean;
    priceOverride: { toString(): string } | null;
    product: {
      id: string;
      categoryId: string;
      name: string;
      slug: string;
      description: string | null;
      basePrice: { toString(): string };
      featured: boolean;
      images: Array<{ storagePath: string }>;
    };
  }): ProductResponse {
    const price = branchProduct.priceOverride ?? branchProduct.product.basePrice;

    return {
      id: branchProduct.product.id,
      categoryId: branchProduct.product.categoryId,
      name: branchProduct.product.name,
      slug: branchProduct.product.slug,
      description: branchProduct.product.description,
      price: price.toString(),
      available: branchProduct.available,
      featured: branchProduct.product.featured,
      imageUrl: branchProduct.product.images[0]?.storagePath ?? null
    };
  }
}
