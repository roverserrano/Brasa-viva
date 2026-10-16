import { BadRequestException, Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { CatalogResponse } from '@brasa-viva/contracts';
import { ProductsService } from './application/products.service';

@ApiTags('products')
@Controller('branches/:slug/menu')
export class ProductsController {
  constructor(@Inject(ProductsService) private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtiene el menú disponible de una sucursal.' })
  @ApiOkResponse({ description: 'Sucursal y productos con precio efectivo.' })
  getMenuForBranch(@Param('slug') slug: string): Promise<CatalogResponse> {
    return this.productsService.getMenuForBranch(slug);
  }

  @Get(':productSlug')
  @ApiOperation({ summary: 'Obtiene un producto disponible para una sucursal.' })
  @ApiOkResponse({ description: 'Producto con precio efectivo.' })
  getProductForBranch(
    @Param('slug') branchSlug: string,
    @Param('productSlug') productSlug: string
  ) {
    return this.productsService.getProductForBranch(branchSlug, productSlug);
  }
}

@ApiTags('products')
@Controller('products')
export class PublicProductsController {
  constructor(@Inject(ProductsService) private readonly productsService: ProductsService) {}

  @Get()
  @ApiQuery({ name: 'branchSlug', required: true, description: 'Sucursal para resolver catálogo.' })
  @ApiOperation({ summary: 'Lista productos disponibles de una sucursal.' })
  listForBranch(@Query('branchSlug') branchSlug?: string): Promise<CatalogResponse> {
    return this.productsService.getMenuForBranch(requireBranchSlug(branchSlug));
  }

  @Get(':slug')
  @ApiQuery({ name: 'branchSlug', required: true, description: 'Sucursal para resolver precio.' })
  @ApiOperation({ summary: 'Obtiene un producto por slug dentro de una sucursal.' })
  getForBranch(@Param('slug') productSlug: string, @Query('branchSlug') branchSlug?: string) {
    return this.productsService.getProductForBranch(requireBranchSlug(branchSlug), productSlug);
  }
}

function requireBranchSlug(branchSlug?: string): string {
  if (!branchSlug) {
    throw new BadRequestException({
      code: 'BRANCH_REQUIRED',
      message: 'Selecciona una sucursal para consultar el catálogo.'
    });
  }

  return branchSlug;
}
