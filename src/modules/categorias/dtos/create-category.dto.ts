import { AppError } from "../../../shared/errors/app-error";

export interface CreateCategoryDto {
  nome: string;
  ordemExibicao: number;
}

export function assertValidCreateCategoryDto(body: unknown): CreateCategoryDto {
  const { nome, ordem_exibicao: ordemExibicao } = (body ?? {}) as Record<string, unknown>;

  if (typeof nome !== "string" || nome.trim().length === 0) {
    throw new AppError("Nome da categoria é obrigatório.", 400);
  }

  if (
    ordemExibicao !== undefined &&
    (typeof ordemExibicao !== "number" || !Number.isInteger(ordemExibicao) || ordemExibicao < 0)
  ) {
    throw new AppError("Ordem de exibição deve ser um número inteiro não negativo.", 400);
  }

  return {
    nome: nome.trim(),
    ordemExibicao: typeof ordemExibicao === "number" ? ordemExibicao : 0,
  };
}
