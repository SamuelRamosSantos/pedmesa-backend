import { AppDataSource } from "../../../config/data-source";
import { CreateCategoryDto } from "../dtos/create-category.dto";
import { Category } from "../entities/category.entity";

export class CategoryService {
  static async create(tenantId: string, dto: CreateCategoryDto): Promise<Category> {
    const repository = AppDataSource.getRepository(Category);

    const category = repository.create({
      tenantId,
      nome: dto.nome,
      ordemExibicao: dto.ordemExibicao,
    });

    return repository.save(category);
  }

  static async listActive(tenantId: string): Promise<Category[]> {
    const repository = AppDataSource.getRepository(Category);

    return repository.find({
      where: { tenantId, ativo: true },
      order: { ordemExibicao: "ASC" },
    });
  }
}
