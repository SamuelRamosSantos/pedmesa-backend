import { AppError } from "../../../shared/errors/app-error";

export interface AddIntegranteDto {
  nome: string;
}

export function assertValidAddIntegranteDto(body: unknown): AddIntegranteDto {
  const { nome } = (body ?? {}) as Record<string, unknown>;

  if (typeof nome !== "string" || nome.trim().length === 0) {
    throw new AppError("Nome do integrante é obrigatório.", 400);
  }

  return { nome: nome.trim() };
}
