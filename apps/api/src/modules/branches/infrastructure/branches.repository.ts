import { Inject, Injectable } from '@nestjs/common';
import { BranchStatus } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../database/prisma.service';

type PublicBranch = {
  id: string;
  name: string;
  slug: string;
  addressLine: string;
  whatsapp: string | null;
};

type BranchWithPublicDetail = PublicBranch & {
  phone: string | null;
  city: string;
  services: Array<{
    serviceType: 'PICKUP' | 'DELIVERY' | 'DINE_IN' | 'QR_PAYMENT';
  }>;
  businessHours: Array<{
    weekday: number;
    opensAt: Date | null;
    closesAt: Date | null;
    isClosed: boolean;
  }>;
};

@Injectable()
export class BranchesRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listPublic(): Promise<PublicBranch[]> {
    return this.prisma.branch.findMany({
      where: {
        deletedAt: null,
        status: BranchStatus.ACTIVE
      },
      orderBy: { name: 'asc' }
    });
  }

  async findPublicBySlug(slug: string): Promise<PublicBranch | null> {
    return this.prisma.branch.findFirst({
      where: {
        slug,
        deletedAt: null,
        status: BranchStatus.ACTIVE
      }
    });
  }

  async findPublicDetailBySlug(slug: string): Promise<BranchWithPublicDetail | null> {
    return this.prisma.branch.findFirst({
      where: {
        slug,
        deletedAt: null,
        status: BranchStatus.ACTIVE
      },
      include: {
        services: {
          where: { deletedAt: null, enabled: true },
          orderBy: { serviceType: 'asc' }
        },
        businessHours: {
          where: { deletedAt: null },
          orderBy: { weekday: 'asc' }
        }
      }
    });
  }
}
