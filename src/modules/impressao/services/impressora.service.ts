import { AppDataSource } from "../../../config/data-source";
import { AppError } from "../../../shared/errors/app-error";
import { CreateImpressoraDto } from "../dtos/create-impressora.dto";
import { UpdateImpressoraDto } from "../dtos/update-impressora.dto";
import { Impressora } from "../entities/impressora.entity";

export class ImpressoraService {
  static async list(tenantId: string): Promise<Impressora[]> {
    const repository = AppDataSource.getRepository(Impressora);
    return repository.find({ where: { tenantId }, order: { criadoEm: "ASC" } });
  }

  static async create(tenantId: string, dto: CreateImpressoraDto): Promise<Impressora> {
    const repository = AppDataSource.getRepository(Impressora);
    const impressora = repository.create({ tenantId, ...dto });
    return repository.save(impressora);
  }

  static async update(tenantId: string, impressoraId: string, dto: UpdateImpressoraDto): Promise<Impressora> {
    const repository = AppDataSource.getRepository(Impressora);
    const impressora = await repository.findOne({ where: { id: impressoraId, tenantId } });

    if (!impressora) {
      throw new AppError("Impressora não encontrada.", 404);
    }

    if (dto.nome !== undefined) {
      impressora.nome = dto.nome;
    }

    if (dto.ip !== undefined) {
      impressora.ip = dto.ip;
    }

    if (dto.porta !== undefined) {
      impressora.porta = dto.porta;
    }

    if (dto.ativo !== undefined) {
      impressora.ativo = dto.ativo;
    }

    return repository.save(impressora);
  }

  static async delete(tenantId: string, impressoraId: string): Promise<void> {
    const repository = AppDataSource.getRepository(Impressora);
    const resultado = await repository.delete({ id: impressoraId, tenantId });

    if (resultado.affected === 0) {
      throw new AppError("Impressora não encontrada.", 404);
    }
  }
}
