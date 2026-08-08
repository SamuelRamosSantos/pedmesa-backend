import { AppDataSource } from "../../../config/data-source";
import { AppError } from "../../../shared/errors/app-error";
import { SuperAdmin } from "../../admin/entities/super-admin.entity";
import { TenantStatus } from "../../tenants/entities/tenant.entity";
import { User, UserRole } from "../../usuarios/entities/user.entity";
import { LoginDto } from "../dtos/login.dto";
import { HashService } from "./hash.service";
import { signSuperAdminToken, signToken } from "../utils/jwt.util";

export interface TenantLoginResult {
  tipo: "tenant";
  token: string;
  usuario: {
    id: string;
    nome: string;
    roles: UserRole[];
    tenant_id: string;
    pode_excluir_item_fechamento: boolean;
    pode_conceder_desconto: boolean;
  };
}

export interface SuperAdminLoginResult {
  tipo: "super_admin";
  token: string;
  super_admin: {
    id: string;
    nome: string;
    email: string;
  };
}

export type LoginResult = TenantLoginResult | SuperAdminLoginResult;

const TENANT_STATUS_INDISPONIVEL_MESSAGE = "Este estabelecimento está indisponível no momento. Entre em contato com o suporte.";

export class AuthService {
  static async login({ email, senha }: LoginDto): Promise<LoginResult> {
    const superAdminResult = await this.tentarLoginSuperAdmin(email, senha);

    if (superAdminResult) {
      return superAdminResult;
    }

    return this.loginTenant(email, senha);
  }

  private static async tentarLoginSuperAdmin(email: string, senha: string): Promise<SuperAdminLoginResult | null> {
    const superAdminRepository = AppDataSource.getRepository(SuperAdmin);
    const superAdmin = await superAdminRepository.findOne({ where: { email } });

    if (!superAdmin) {
      return null;
    }

    if (!superAdmin.ativo) {
      throw new AppError("Credenciais inválidas.", 401);
    }

    const senhaValida = await HashService.compare(senha, superAdmin.senhaHash);

    if (!senhaValida) {
      throw new AppError("Credenciais inválidas.", 401);
    }

    const token = signSuperAdminToken({ sub: superAdmin.id, type: "super_admin" });

    return {
      tipo: "super_admin",
      token,
      super_admin: {
        id: superAdmin.id,
        nome: superAdmin.nome,
        email: superAdmin.email,
      },
    };
  }

  private static async loginTenant(email: string, senha: string): Promise<TenantLoginResult> {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email }, relations: { tenant: true } });

    if (!user || !user.ativo) {
      throw new AppError("Credenciais inválidas.", 401);
    }

    if (user.tenant.status !== TenantStatus.ATIVO) {
      throw new AppError(TENANT_STATUS_INDISPONIVEL_MESSAGE, 403);
    }

    const senhaValida = await HashService.compare(senha, user.senhaHash);

    if (!senhaValida) {
      throw new AppError("Credenciais inválidas.", 401);
    }

    const token = signToken({
      sub: user.id,
      tenant_id: user.tenantId,
      roles: user.roles,
      pode_excluir_item_fechamento: user.podeExcluirItemFechamento,
      pode_conceder_desconto: user.podeConcederDesconto,
    });

    return {
      tipo: "tenant",
      token,
      usuario: {
        id: user.id,
        nome: user.nome,
        roles: user.roles,
        tenant_id: user.tenantId,
        pode_excluir_item_fechamento: user.podeExcluirItemFechamento,
        pode_conceder_desconto: user.podeConcederDesconto,
      },
    };
  }
}
