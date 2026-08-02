import { AppDataSource } from "../../../config/data-source";
import { AppError } from "../../../shared/errors/app-error";
import { Tenant } from "../entities/tenant.entity";

export class TenantService {
  static async getMe(tenantId: string): Promise<Tenant> {
    const repository = AppDataSource.getRepository(Tenant);
    const tenant = await repository.findOne({ where: { id: tenantId } });

    if (!tenant) {
      throw new AppError("Tenant não encontrado.", 404);
    }

    return tenant;
  }

  static async updateConfiguracoes(tenantId: string, quantidadeComandas: number): Promise<Tenant> {
    const tenant = await this.getMe(tenantId);
    tenant.quantidadeComandas = quantidadeComandas;

    const repository = AppDataSource.getRepository(Tenant);
    return repository.save(tenant);
  }
}
