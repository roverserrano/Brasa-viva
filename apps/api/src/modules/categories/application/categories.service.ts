import { Inject, Injectable } from '@nestjs/common';
import { categoryListResponseSchema, type CategoryListResponse } from '@brasa-viva/contracts';
import { CategoriesRepository } from '../infrastructure/categories.repository';

@Injectable()
export class CategoriesService {
  constructor(@Inject(CategoriesRepository) private readonly categoriesRepository: CategoriesRepository) {}

  async listPublic(): Promise<CategoryListResponse> {
    const categories = await this.categoriesRepository.listPublic();
    return categoryListResponseSchema.parse(
      categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description
      }))
    );
  }
}
