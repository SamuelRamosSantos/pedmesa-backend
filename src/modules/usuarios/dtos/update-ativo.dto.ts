import { AppError } from "../../../shared/errors/app-error";

export interface UpdateAtivoDto {
  ativo: boolean;
}

export function assertValidUpdateAtivoDto(body: unknown): UpdateAtivoDto {
  const { ativo } = (body ?? {}) as Record<string, unknown>;

  if (typeof ativo !== "boolean") {
    throw new AppError("Campo ativo é obrigatório e deve ser booleano.", 400);
  }

  return { ativo };
}
