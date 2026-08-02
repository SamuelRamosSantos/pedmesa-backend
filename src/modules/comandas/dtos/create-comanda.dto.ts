import { AppError } from "../../../shared/errors/app-error";

export interface CreateComandaIntegranteInput {
  nome: string;
}

export interface CreateComandaDto {
  numeroComanda: number;
  integrantes: CreateComandaIntegranteInput[];
}

function assertValidIntegrante(item: unknown, index: number): CreateComandaIntegranteInput {
  const nome = (item as Record<string, unknown> | null)?.nome;

  if (typeof nome !== "string" || nome.trim().length === 0) {
    throw new AppError(`O integrante na posição ${index} precisa de um nome válido.`, 400);
  }

  return { nome: nome.trim() };
}

export function assertValidCreateComandaDto(body: unknown): CreateComandaDto {
  const { numero_comanda: numeroComanda, integrantes } = (body ?? {}) as Record<string, unknown>;

  if (typeof numeroComanda !== "number" || !Number.isInteger(numeroComanda) || numeroComanda <= 0) {
    throw new AppError("numero_comanda deve ser um número inteiro maior que zero.", 400);
  }

  if (!Array.isArray(integrantes) || integrantes.length === 0) {
    throw new AppError("É necessário informar ao menos um integrante.", 400);
  }

  return {
    numeroComanda,
    integrantes: integrantes.map(assertValidIntegrante),
  };
}
