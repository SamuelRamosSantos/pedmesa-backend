import { AppDataSource } from "../../../config/data-source";
import { AppError } from "../../../shared/errors/app-error";
import { isUniqueViolation } from "../../../shared/utils/is-unique-violation";
import { TenantLoginResult } from "../../auth/services/auth.service";
import { HashService } from "../../auth/services/hash.service";
import { signToken } from "../../auth/utils/jwt.util";
import { Tenant, TenantStatus } from "../../tenants/entities/tenant.entity";
import { User, UserRole } from "../../usuarios/entities/user.entity";
import { CreateTenantDto } from "../dtos/create-tenant.dto";
import { ListTenantsFilters } from "../dtos/list-tenants.dto";
import { UpdateTenantDto } from "../dtos/update-tenant.dto";

// PED-41: sessão de impersonation usa expiração bem mais curta que o login
// normal (padrão JWT_EXPIRES_IN=1d) — é um acesso privilegiado e temporário,
// não uma sessão de trabalho normal do dia a dia.
const IMPERSONATION_TOKEN_EXPIRES_IN = "30m";

export class SuperAdminService {
  static async criarTenant(dto: CreateTenantDto): Promise<Tenant> {
    const tenantRepository = AppDataSource.getRepository(Tenant);
    const userRepository = AppDataSource.getRepository(User);

    const cnpjEmUso = await tenantRepository.findOne({ where: { cnpjCpf: dto.cnpjCpf } });

    if (cnpjEmUso) {
      throw new AppError("Já existe um estabelecimento cadastrado com esse CNPJ/CPF.", 409);
    }

    const emailEmUso = await userRepository.findOne({ where: { email: dto.adminEmail } });

    if (emailEmUso) {
      throw new AppError("Já existe um usuário cadastrado com esse e-mail.", 409);
    }

    try {
      return await AppDataSource.transaction(async (manager) => {
        const tenant = await manager.save(
          manager.create(Tenant, {
            nomeFantasia: dto.nomeFantasia,
            cnpjCpf: dto.cnpjCpf,
            status: TenantStatus.ATIVO,
          })
        );

        const senhaHash = await HashService.hash(dto.adminSenha);

        await manager.save(
          manager.create(User, {
            tenantId: tenant.id,
            nome: dto.adminNome,
            email: dto.adminEmail,
            senhaHash,
            roles: [UserRole.ADMIN],
            podeExcluirItemFechamento: true,
            podeConcederDesconto: true,
            ativo: true,
          })
        );

        return tenant;
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError("Já existe um estabelecimento ou usuário com esses dados.", 409);
      }

      throw error;
    }
  }

  static async listarTenants(filters: ListTenantsFilters): Promise<Tenant[]> {
    const repository = AppDataSource.getRepository(Tenant);
    const query = repository.createQueryBuilder("tenant").orderBy("tenant.criadoEm", "DESC");

    if (filters.status) {
      query.andWhere("tenant.status = :status", { status: filters.status });
    }

    if (filters.nome) {
      query.andWhere("tenant.nomeFantasia ILIKE :nome", { nome: `%${filters.nome}%` });
    }

    return query.getMany();
  }

  static async atualizarTenant(tenantId: string, dto: UpdateTenantDto): Promise<Tenant> {
    const repository = AppDataSource.getRepository(Tenant);
    const tenant = await repository.findOne({ where: { id: tenantId } });

    if (!tenant) {
      throw new AppError("Estabelecimento não encontrado.", 404);
    }

    if (dto.cnpjCpf !== undefined && dto.cnpjCpf !== tenant.cnpjCpf) {
      const cnpjEmUso = await repository.findOne({ where: { cnpjCpf: dto.cnpjCpf } });

      if (cnpjEmUso) {
        throw new AppError("Já existe um estabelecimento cadastrado com esse CNPJ/CPF.", 409);
      }
    }

    if (dto.nomeFantasia !== undefined) {
      tenant.nomeFantasia = dto.nomeFantasia;
    }

    if (dto.cnpjCpf !== undefined) {
      tenant.cnpjCpf = dto.cnpjCpf;
    }

    if (dto.razaoSocial !== undefined) {
      tenant.razaoSocial = dto.razaoSocial;
    }

    if (dto.inscricaoEstadual !== undefined) {
      tenant.inscricaoEstadual = dto.inscricaoEstadual;
    }

    if (dto.ramoAtividade !== undefined) {
      tenant.ramoAtividade = dto.ramoAtividade;
    }

    if (dto.nomeProprietario !== undefined) {
      tenant.nomeProprietario = dto.nomeProprietario;
    }

    if (dto.cpfProprietario !== undefined) {
      tenant.cpfProprietario = dto.cpfProprietario;
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

    try {
      return await repository.save(tenant);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError("Já existe um estabelecimento cadastrado com esse CNPJ/CPF.", 409);
      }

      throw error;
    }
  }

  static async atualizarStatus(tenantId: string, status: TenantStatus): Promise<Tenant> {
    const repository = AppDataSource.getRepository(Tenant);
    const tenant = await repository.findOne({ where: { id: tenantId } });

    if (!tenant) {
      throw new AppError("Estabelecimento não encontrado.", 404);
    }

    tenant.status = status;

    return repository.save(tenant);
  }

  static async impersonarTenant(tenantId: string, superAdminId: string): Promise<TenantLoginResult> {
    const tenantRepository = AppDataSource.getRepository(Tenant);
    const tenant = await tenantRepository.findOne({ where: { id: tenantId } });

    if (!tenant) {
      throw new AppError("Estabelecimento não encontrado.", 404);
    }

    const userRepository = AppDataSource.getRepository(User);
    const adminUser = await userRepository
      .createQueryBuilder("user")
      .where("user.tenantId = :tenantId", { tenantId })
      .andWhere("user.ativo = true")
      .andWhere("user.roles @> ARRAY[:role]::usuarios_role_enum[]", { role: UserRole.ADMIN })
      .orderBy("user.criadoEm", "ASC")
      .getOne();

    if (!adminUser) {
      throw new AppError("Este estabelecimento não possui um administrador ativo para acessar como.", 400);
    }

    const token = signToken(
      {
        sub: adminUser.id,
        tenant_id: tenant.id,
        roles: adminUser.roles,
        pode_excluir_item_fechamento: adminUser.podeExcluirItemFechamento,
        pode_conceder_desconto: adminUser.podeConcederDesconto,
        impersonated_by: superAdminId,
      },
      { expiresIn: IMPERSONATION_TOKEN_EXPIRES_IN }
    );

    return {
      tipo: "tenant",
      token,
      usuario: {
        id: adminUser.id,
        nome: adminUser.nome,
        roles: adminUser.roles,
        tenant_id: tenant.id,
        pode_excluir_item_fechamento: adminUser.podeExcluirItemFechamento,
        pode_conceder_desconto: adminUser.podeConcederDesconto,
      },
    };
  }
}
