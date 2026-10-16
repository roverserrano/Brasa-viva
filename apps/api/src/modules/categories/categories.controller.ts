import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CategoryListResponse } from '@brasa-viva/contracts';
import { CategoriesService } from './application/categories.service';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(@Inject(CategoriesService) private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista categorías públicas activas.' })
  @ApiOkResponse({ description: 'Categorías públicas.' })
  listPublic(): Promise<CategoryListResponse> {
    return this.categoriesService.listPublic();
  }
}
