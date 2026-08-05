import { AppError } from "../../../shared/errors/app-error";
import { UserRole } from "../entities/user.entity";
import { assertValidRoles } from "./validate-roles";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface UpdateUserDto {
  nome?: string;
  email?: string;
  roles?: UserRole[];
  podeExcluirItemFechamento?: boolean;
  ativo?: boolean;
}

export function assertValidUpdateUserDto(body: unknown): UpdateUserDto {
  const {
    nome,
    email,
    roles,
    pode_excluir_item_fechamento: podeExcluirItemFechamento,
    ativo,
  } = (body ?? {}) as Record<string, unknown>;

  const dto: UpdateUserDto = {};

  if (nome !== undefined) {
    if (typeof nome !== "string" || nome.trim().length === 0) {
      throw new AppError("Nome é obrigatório.", 400);
    }
    dto.nome = nome.trim();
  }

  if (email !== undefined) {
    if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      throw new AppError("E-mail inválido.", 400);
    }
    dto.email = email.trim().toLowerCase();
  }

  if (roles !== undefined) {
    dto.roles = assertValidRoles(roles);
  }

  if (podeExcluirItemFechamento !== undefined) {
    if (typeof podeExcluirItemFechamento !== "boolean") {
      throw new AppError("Campo pode_excluir_item_fechamento deve ser booleano.", 400);
    }
    dto.podeExcluirItemFechamento = podeExcluirItemFechamento;
  }

  if (ativo !== undefined) {
    if (typeof ativo !== "boolean") {
      throw new AppError("Campo ativo deve ser booleano.", 400);
    }
    dto.ativo = ativo;
  }

  if (Object.keys(dto).length === 0) {
    throw new AppError("Informe ao menos um campo para atualizar.", 400);
  }

  return dto;
}
