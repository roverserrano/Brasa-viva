import { Inject, Injectable } from '@nestjs/common';
import type { Promotion } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class PromotionsRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findActive(now: Date, branchId?: string): Promise<Promotion[]> {
    return this.prisma.promotion.findMany({
      where: {
        active: true,
        deletedAt: null,
        startsAt: { lte: now },
        endsAt: { gt: now },
        products: { some: { deletedAt: null } },
        ...(branchId
          ? {
              OR: [
                { branches: { none: { deletedAt: null } } },
                { branches: { some: { branchId, deletedAt: null } } }
              ]
            }
          : { branches: { none: { deletedAt: null } } })
      },
      orderBy: { endsAt: 'asc' }
    });
  }
}
