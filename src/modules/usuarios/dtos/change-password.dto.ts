import { AppError } from "../../../shared/errors/app-error";

const SENHA_MIN_LENGTH = 6;

export interface ChangePasswordDto {
  novaSenha: string;
}

export function assertValidChangePasswordDto(body: unknown): ChangePasswordDto {
  const { nova_senha: novaSenha } = (body ?? {}) as Record<string, unknown>;

  if (typeof novaSenha !== "string" || novaSenha.length < SENHA_MIN_LENGTH) {
    throw new AppError(`Senha deve ter ao menos ${SENHA_MIN_LENGTH} caracteres.`, 400);
  }

  return { novaSenha };
}
