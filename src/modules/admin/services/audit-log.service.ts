import { AppDataSource } from "../../../config/data-source";
import { AuditLog } from "../entities/audit-log.entity";

export interface RegistrarAuditLogParams {
  superAdminId: string;
  tenantId: string;
  usuarioId: string;
  metodo: string;
  rota: string;
}

export class AuditLogService {
  static async registrar(params: RegistrarAuditLogParams): Promise<void> {
    const repository = AppDataSource.getRepository(AuditLog);

    await repository.save(
      repository.create({
        superAdminId: params.superAdminId,
        tenantId: params.tenantId,
        usuarioId: params.usuarioId,
        metodo: params.metodo,
        rota: params.rota,
      })
    );
  }
}
