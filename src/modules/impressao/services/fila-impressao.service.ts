import { AppDataSource } from "../../../config/data-source";
import { AppError } from "../../../shared/errors/app-error";
import { UpdateStatusFilaDto } from "../dtos/update-status-fila.dto";
import { FilaImpressao, StatusFilaImpressao } from "../entities/fila-impressao.entity";

export class FilaImpressaoService {
  static async listPendentes(tenantId: string): Promise<FilaImpressao[]> {
    const repository = AppDataSource.getRepository(FilaImpressao);
    return repository.find({
      where: { tenantId, status: StatusFilaImpressao.PENDENTE },
      order: { criadoEm: "ASC" },
    });
  }

  static async updateStatus(tenantId: string, filaImpressaoId: string, dto: UpdateStatusFilaDto): Promise<FilaImpressao> {
    const repository = AppDataSource.getRepository(FilaImpressao);
    const job = await repository.findOne({ where: { id: filaImpressaoId, tenantId } });

    if (!job) {
      throw new AppError("Job de impressão não encontrado.", 404);
    }

    job.status = dto.status;
    job.erroMensagem = dto.erroMensagem;
    job.tentativas += 1;

    return repository.save(job);
  }
}
