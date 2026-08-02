import { AppDataSource } from "../../../config/data-source";
import { AppError } from "../../../shared/errors/app-error";
import { User } from "../../usuarios/entities/user.entity";
import { LoginDto } from "../dtos/login.dto";
import { HashService } from "./hash.service";
import { signToken } from "../utils/jwt.util";

export interface LoginResult {
  token: string;
  usuario: {
    id: string;
    nome: string;
    role: string;
    tenant_id: string;
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
      role: user.role,
    });

    return {
      token,
      usuario: {
        id: user.id,
        nome: user.nome,
        role: user.role,
        tenant_id: user.tenantId,
      },
    };
  }
}
