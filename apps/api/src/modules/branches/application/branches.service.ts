import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  branchDetailResponseSchema,
  type BranchDetailResponse,
  type BranchListResponse,
  type BranchResponse
} from '@brasa-viva/contracts';
import { z } from 'zod';
import { BranchesRepository } from '../infrastructure/branches.repository';

const publicSlugSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

@Injectable()
export class BranchesService {
  constructor(@Inject(BranchesRepository) private readonly branchesRepository: BranchesRepository) {}

  async listPublic(): Promise<BranchListResponse> {
    const branches = await this.branchesRepository.listPublic();
    return branches.map((branch) => this.toResponse(branch));
  }

  async getPublicBySlug(slug: string): Promise<BranchResponse> {
    const branch = await this.findActiveBySlug(slug);
    return this.toResponse(branch);
  }

  async getPublicDetailBySlug(slug: string): Promise<BranchDetailResponse> {
    const parsedSlug = this.parseSlug(slug);
    const branch = await this.branchesRepository.findPublicDetailBySlug(parsedSlug);

    if (!branch) {
      throw new NotFoundException({
        code: 'BRANCH_NOT_FOUND',
        message: 'La sucursal no está disponible.'
      });
    }

    return branchDetailResponseSchema.parse({
      ...this.toResponse(branch),
      phone: branch.phone,
      city: branch.city,
      services: branch.services.map((service) => service.serviceType),
      businessHours: branch.businessHours.map((businessHour) => ({
        weekday: businessHour.weekday,
        opensAt: businessHour.opensAt?.toISOString() ?? null,
        closesAt: businessHour.closesAt?.toISOString() ?? null,
        isClosed: businessHour.isClosed
      }))
    });
  }

  async findActiveBySlug(slug: string) {
    const branch = await this.branchesRepository.findPublicBySlug(this.parseSlug(slug));

    if (!branch) {
      throw new NotFoundException({
        code: 'BRANCH_NOT_FOUND',
        message: 'La sucursal no está disponible.'
      });
    }

    return branch;
  }

  private parseSlug(slug: string): string {
    const parsedSlug = publicSlugSchema.safeParse(slug);

    if (!parsedSlug.success) {
      throw new BadRequestException({
        code: 'INVALID_BRANCH_SLUG',
        message: 'La sucursal solicitada no es válida.'
      });
    }

    return parsedSlug.data;
  }

  toResponse(branch: {
    id: string;
    name: string;
    slug: string;
    addressLine: string;
    whatsapp: string | null;
  }): BranchResponse {
    return {
      id: branch.id,
      name: branch.name,
      slug: branch.slug,
      address: branch.addressLine,
      whatsapp: branch.whatsapp,
      active: true
    };
  }
}
