import { FindOptionsWhere } from "typeorm";
import { AppDataSource } from "../../../config/data-source";
import { AppError } from "../../../shared/errors/app-error";
import { Category } from "../../categorias/entities/category.entity";
import { Tenant } from "../../tenants/entities/tenant.entity";
import { CreateProductDto } from "../dtos/create-product.dto";
import { ListProductsFilters } from "../dtos/list-products.dto";
import { UpdateProductDto } from "../dtos/update-product.dto";
import { Product } from "../entities/product.entity";

async function isUsaModuloCozinha(tenantId: string): Promise<boolean> {
  const tenantRepository = AppDataSource.getRepository(Tenant);
  const tenant = await tenantRepository.findOne({ where: { id: tenantId } });

  if (!tenant) {
    throw new AppError("Tenant não encontrado.", 404);
  }

  return tenant.usaModuloCozinha;
}

export class ProductService {
  static async create(tenantId: string, dto: CreateProductDto): Promise<Product> {
    const categoryRepository = AppDataSource.getRepository(Category);
    const category = await categoryRepository.findOne({
      where: { id: dto.categoriaId, tenantId },
    });

    if (!category) {
      throw new AppError("Categoria não encontrada.", 404);
    }

    const usaModuloCozinha = await isUsaModuloCozinha(tenantId);

    const productRepository = AppDataSource.getRepository(Product);
    const product = productRepository.create({
      tenantId,
      categoriaId: dto.categoriaId,
      nome: dto.nome,
      preco: dto.preco,
      descricao: dto.descricao,
      disponivel: dto.disponivel,
      precisaPreparo: usaModuloCozinha ? dto.precisaPreparo : false,
      imagemUrl: dto.imagemUrl,
    });

    return productRepository.save(product);
  }

  static async list(tenantId: string, filters: ListProductsFilters): Promise<Product[]> {
    const repository = AppDataSource.getRepository(Product);
    const where: FindOptionsWhere<Product> = { tenantId, ativo: true };

    if (filters.categoriaId) {
      where.categoriaId = filters.categoriaId;
    }

    if (filters.disponivel !== undefined) {
      where.disponivel = filters.disponivel;
    }

    return repository.find({ where, order: { nome: "ASC" } });
  }

  static async updateDisponibilidade(tenantId: string, productId: string, disponivel: boolean): Promise<Product> {
    const repository = AppDataSource.getRepository(Product);
    const product = await repository.findOne({ where: { id: productId, tenantId } });

    if (!product) {
      throw new AppError("Produto não encontrado.", 404);
    }

    product.disponivel = disponivel;

    return repository.save(product);
  }

  static async update(tenantId: string, productId: string, dto: UpdateProductDto): Promise<Product> {
    const repository = AppDataSource.getRepository(Product);
    const product = await repository.findOne({ where: { id: productId, tenantId } });

    if (!product) {
      throw new AppError("Produto não encontrado.", 404);
    }

    if (dto.categoriaId !== undefined) {
      const categoryRepository = AppDataSource.getRepository(Category);
      const category = await categoryRepository.findOne({ where: { id: dto.categoriaId, tenantId } });

      if (!category) {
        throw new AppError("Categoria não encontrada.", 404);
      }

      product.categoriaId = dto.categoriaId;
    }

    if (dto.nome !== undefined) {
      product.nome = dto.nome;
    }

    if (dto.preco !== undefined) {
      product.preco = dto.preco;
    }

    if (dto.descricao !== undefined) {
      product.descricao = dto.descricao;
    }

    if (dto.disponivel !== undefined) {
      product.disponivel = dto.disponivel;
    }

    if (dto.precisaPreparo !== undefined) {
      const usaModuloCozinha = await isUsaModuloCozinha(tenantId);
      product.precisaPreparo = usaModuloCozinha ? dto.precisaPreparo : false;
    }

    if (dto.imagemUrl !== undefined) {
      product.imagemUrl = dto.imagemUrl;
    }

    return repository.save(product);
  }

  static async delete(tenantId: string, productId: string): Promise<void> {
    const repository = AppDataSource.getRepository(Product);
    const product = await repository.findOne({ where: { id: productId, tenantId } });

    if (!product) {
      throw new AppError("Produto não encontrado.", 404);
    }

    product.ativo = false;
    await repository.save(product);
  }
}
