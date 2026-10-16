import { Inject, Injectable } from '@nestjs/common';
import {
  promotionListResponseSchema,
  type PromotionListResponse,
  type PromotionResponse
} from '@brasa-viva/contracts';
import { BranchesService } from '../../branches/application/branches.service';
import { PromotionsRepository } from '../infrastructure/promotions.repository';

@Injectable()
export class PromotionsService {
  constructor(
    @Inject(BranchesService) private readonly branchesService: BranchesService,
    @Inject(PromotionsRepository) private readonly promotionsRepository: PromotionsRepository
  ) {}

  async listActive(branchSlug?: string): Promise<PromotionListResponse> {
    const branch = branchSlug ? await this.branchesService.findActiveBySlug(branchSlug) : null;
    const promotions = await this.promotionsRepository.findActive(new Date(), branch?.id);

    return promotionListResponseSchema.parse(promotions.map((promotion) => this.toResponse(promotion)));
  }

  private toResponse(promotion: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    promotionType: 'FIXED_PRICE' | 'PERCENTAGE' | 'FIXED_DISCOUNT' | 'BUNDLE';
    promoPrice: { toString(): string } | null;
    discountPercent: { toString(): string } | null;
    discountAmount: { toString(): string } | null;
    endsAt: Date;
  }): PromotionResponse {
    return {
      id: promotion.id,
      slug: promotion.slug,
      name: promotion.name,
      description: promotion.description,
      type: promotion.promotionType,
      promoPrice: promotion.promoPrice?.toString() ?? null,
      discountPercent: promotion.discountPercent?.toString() ?? null,
      discountAmount: promotion.discountAmount?.toString() ?? null,
      endsAt: promotion.endsAt.toISOString()
    };
  }
}
