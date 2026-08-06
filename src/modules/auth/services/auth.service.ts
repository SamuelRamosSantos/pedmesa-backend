import { AppDataSource } from "../../../config/data-source";
import { AppError } from "../../../shared/errors/app-error";
import { User, UserRole } from "../../usuarios/entities/user.entity";
import { LoginDto } from "../dtos/login.dto";
import { HashService } from "./hash.service";
import { signToken } from "../utils/jwt.util";

export interface LoginResult {
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

export class AuthService {
  static async login({ email, senha }: LoginDto): Promise<LoginResult> {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });

    if (!user || !user.ativo) {
      throw new AppError("Credenciais inválidas.", 401);
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
