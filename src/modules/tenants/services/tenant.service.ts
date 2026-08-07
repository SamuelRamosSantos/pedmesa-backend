import { randomBytes } from "crypto";
import { AppDataSource } from "../../../config/data-source";
import { AppError } from "../../../shared/errors/app-error";
import { UpdateTenantConfigDto } from "../dtos/update-tenant-config.dto";
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

  static async updateConfiguracoes(tenantId: string, dto: UpdateTenantConfigDto): Promise<Tenant> {
    const tenant = await this.getMe(tenantId);

    if (dto.nomeFantasia !== undefined) {
      tenant.nomeFantasia = dto.nomeFantasia;
    }

    if (dto.ramoAtividade !== undefined) {
      tenant.ramoAtividade = dto.ramoAtividade;
    }

    if (dto.emailEmpresa !== undefined) {
      tenant.emailEmpresa = dto.emailEmpresa;
    }

    if (dto.emailProprietario !== undefined) {
      tenant.emailProprietario = dto.emailProprietario;
    }

    if (dto.usaModuloCozinha !== undefined) {
      tenant.usaModuloCozinha = dto.usaModuloCozinha;
    }

    if (dto.quantidadeComandas !== undefined) {
      tenant.quantidadeComandas = dto.quantidadeComandas;
    }

    if (dto.logradouro !== undefined) {
      tenant.logradouro = dto.logradouro;
    }

    if (dto.numero !== undefined) {
      tenant.numero = dto.numero;
    }

    if (dto.bairro !== undefined) {
      tenant.bairro = dto.bairro;
    }

    if (dto.cidade !== undefined) {
      tenant.cidade = dto.cidade;
    }

    if (dto.estado !== undefined) {
      tenant.estado = dto.estado;
    }

    if (dto.cep !== undefined) {
      tenant.cep = dto.cep;
    }

    const repository = AppDataSource.getRepository(Tenant);
    return repository.save(tenant);
  }

  static async regenerarTokenAgente(tenantId: string): Promise<Tenant> {
    const tenant = await this.getMe(tenantId);
    tenant.tokenAgente = randomBytes(32).toString("hex");

    const repository = AppDataSource.getRepository(Tenant);
    return repository.save(tenant);
  }
}
