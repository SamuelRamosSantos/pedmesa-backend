import { AppDataSource } from "../../../config/data-source";
import { AppError } from "../../../shared/errors/app-error";
import { isUniqueViolation } from "../../../shared/utils/is-unique-violation";
import { CreateTaxaEntregaDto } from "../dtos/create-taxa-entrega.dto";
import { UpdateTaxaEntregaDto } from "../dtos/update-taxa-entrega.dto";
import { TaxaEntrega } from "../entities/taxa-entrega.entity";

function erroBairroDuplicado(taxa: Pick<TaxaEntrega, "bairro" | "cidade">): AppError {
  return new AppError(`Já existe uma taxa para o bairro "${taxa.bairro}" em ${taxa.cidade}.`, 409);
}

// Sempre save(), nunca update(): os hooks da entidade TaxaEntrega recalculam
// cidade_normalizada e bairro_normalizado, que são a chave de unicidade e de busca.
async function salvar(taxa: TaxaEntrega): Promise<TaxaEntrega> {
  try {
    return await AppDataSource.getRepository(TaxaEntrega).save(taxa);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw erroBairroDuplicado(taxa);
    }

    throw error;
  }
}

export class TaxaEntregaService {
  static async listar(tenantId: string): Promise<TaxaEntrega[]> {
    return AppDataSource.getRepository(TaxaEntrega).find({
      where: { tenantId },
      order: { cidadeNormalizada: "ASC", bairroNormalizado: "ASC" },
    });
  }

  static async criar(tenantId: string, dto: CreateTaxaEntregaDto): Promise<TaxaEntrega> {
    return salvar(AppDataSource.getRepository(TaxaEntrega).create({ tenantId, ...dto }));
  }

  static async atualizar(tenantId: string, taxaId: string, dto: UpdateTaxaEntregaDto): Promise<TaxaEntrega> {
    const taxa = await AppDataSource.getRepository(TaxaEntrega).findOneBy({ id: taxaId, tenantId });

    if (!taxa) {
      throw new AppError("Taxa de entrega não encontrada.", 404);
    }

    Object.assign(taxa, dto);

    return salvar(taxa);
  }

  // Permitido mesmo se a taxa já foi usada: cada entrega guarda uma cópia do valor cobrado.
  static async remover(tenantId: string, taxaId: string): Promise<void> {
    const resultado = await AppDataSource.getRepository(TaxaEntrega).delete({ id: taxaId, tenantId });

    if (resultado.affected === 0) {
      throw new AppError("Taxa de entrega não encontrada.", 404);
    }
  }
}
