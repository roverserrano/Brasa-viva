import { Controller, Get, Inject, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { BranchDetailResponse, BranchListResponse } from '@brasa-viva/contracts';
import { BranchesService } from './application/branches.service';

@ApiTags('branches')
@Controller('branches')
export class BranchesController {
  constructor(@Inject(BranchesService) private readonly branchesService: BranchesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista las sucursales públicas activas.' })
  @ApiOkResponse({ description: 'Sucursales públicas.' })
  listPublic(): Promise<BranchListResponse> {
    return this.branchesService.listPublic();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Obtiene el detalle, horarios y servicios de una sucursal pública.' })
  @ApiOkResponse({ description: 'Detalle de sucursal pública.' })
  getPublicDetailBySlug(@Param('slug') slug: string): Promise<BranchDetailResponse> {
    return this.branchesService.getPublicDetailBySlug(slug);
  }
}
