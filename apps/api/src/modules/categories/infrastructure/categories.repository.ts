import { Inject, Injectable } from '@nestjs/common';
import type { Category } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class CategoriesRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listPublic(): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: { active: true, deletedAt: null },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }]
    });
  }
}
