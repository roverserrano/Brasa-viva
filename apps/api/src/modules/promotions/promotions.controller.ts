import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { PromotionListResponse } from '@brasa-viva/contracts';
import { PromotionsService } from './application/promotions.service';

@ApiTags('promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(@Inject(PromotionsService) private readonly promotionsService: PromotionsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista promociones activas y vigentes.' })
  @ApiQuery({ name: 'branchSlug', required: false, description: 'Sucursal para filtrar alcance.' })
  @ApiOkResponse({ description: 'Promociones públicas vigentes.' })
  listActive(@Query('branchSlug') branchSlug?: string): Promise<PromotionListResponse> {
    return this.promotionsService.listActive(branchSlug);
  }
}
