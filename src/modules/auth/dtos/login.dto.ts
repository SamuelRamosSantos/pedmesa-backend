import { AppError } from "../../../shared/errors/app-error";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface LoginDto {
  email: string;
  senha: string;
}

export function assertValidLoginDto(body: unknown): LoginDto {
  const { email, senha } = (body ?? {}) as Partial<LoginDto>;

  if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    throw new AppError("E-mail inválido.", 400);
  }

  if (typeof senha !== "string" || senha.length === 0) {
    throw new AppError("Senha é obrigatória.", 400);
  }

  return { email: email.trim().toLowerCase(), senha };
}
