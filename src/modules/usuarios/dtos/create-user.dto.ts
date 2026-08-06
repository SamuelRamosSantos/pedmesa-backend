import { AppError } from "../../../shared/errors/app-error";
import { UserRole } from "../entities/user.entity";
import { assertValidRoles } from "./validate-roles";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENHA_MIN_LENGTH = 6;

export interface CreateUserDto {
  nome: string;
  email: string;
  senha: string;
  roles: UserRole[];
  podeExcluirItemFechamento: boolean;
  podeConcederDesconto: boolean;
}

export function assertValidCreateUserDto(body: unknown): CreateUserDto {
  const {
    nome,
    email,
    senha,
    roles,
    pode_excluir_item_fechamento: podeExcluirItemFechamento,
    pode_conceder_desconto: podeConcederDesconto,
  } = (body ?? {}) as Record<string, unknown>;

  if (typeof nome !== "string" || nome.trim().length === 0) {
    throw new AppError("Nome é obrigatório.", 400);
  }

  if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    throw new AppError("E-mail inválido.", 400);
  }

  if (typeof senha !== "string" || senha.length < SENHA_MIN_LENGTH) {
    throw new AppError(`Senha deve ter ao menos ${SENHA_MIN_LENGTH} caracteres.`, 400);
  }

  if (podeExcluirItemFechamento !== undefined && typeof podeExcluirItemFechamento !== "boolean") {
    throw new AppError("Campo pode_excluir_item_fechamento deve ser booleano.", 400);
  }

  if (podeConcederDesconto !== undefined && typeof podeConcederDesconto !== "boolean") {
    throw new AppError("Campo pode_conceder_desconto deve ser booleano.", 400);
  }

  return {
    nome: nome.trim(),
    email: email.trim().toLowerCase(),
    senha,
    roles: assertValidRoles(roles),
    podeExcluirItemFechamento: typeof podeExcluirItemFechamento === "boolean" ? podeExcluirItemFechamento : false,
    podeConcederDesconto: typeof podeConcederDesconto === "boolean" ? podeConcederDesconto : false,
  };
}
