import { AppError } from "../../../shared/errors/app-error";
import { NOME_CLIENTE_MAX } from "./cliente-input.validator";

export const CLIENTES_POR_PAGINA_PADRAO = 20;
export const CLIENTES_POR_PAGINA_MAX = 50;
const PAGINA_MAX = 10_000;

export interface ListarClientesQuery {
  // null = sem filtro (lista todos).
  busca: string | null;
  pagina: number;
  porPagina: number;
}

function inteiroNoIntervalo(
  valor: unknown,
  campo: string,
  padrao: number,
  maximo: number,
): number {
  if (valor === undefined) {
    return padrao;
  }

  const numero = typeof valor === "string" ? Number(valor) : Number.NaN;

  if (!Number.isInteger(numero) || numero < 1 || numero > maximo) {
    throw new AppError(
      `${campo} deve ser um número inteiro entre 1 e ${maximo}.`,
      400,
    );
  }

  return numero;
}

// GET /clientes?busca=&pagina=&por_pagina= (PED-122). A busca aceita nome ou telefone;
// quem decide como interpretar é o service.
export function assertValidListarClientesQuery(
  query: unknown,
): ListarClientesQuery {
  const {
    busca,
    pagina,
    por_pagina: porPagina,
  } = (query ?? {}) as Record<string, unknown>;

  if (busca !== undefined && typeof busca !== "string") {
    throw new AppError("busca deve ser um texto.", 400);
  }

  const buscaLimpa = busca?.trim() ?? "";

  if (buscaLimpa.length > NOME_CLIENTE_MAX) {
    throw new AppError(
      `busca deve ter no máximo ${NOME_CLIENTE_MAX} caracteres.`,
      400,
    );
  }

  return {
    busca: buscaLimpa === "" ? null : buscaLimpa,
    pagina: inteiroNoIntervalo(pagina, "pagina", 1, PAGINA_MAX),
    porPagina: inteiroNoIntervalo(
      porPagina,
      "por_pagina",
      CLIENTES_POR_PAGINA_PADRAO,
      CLIENTES_POR_PAGINA_MAX,
    ),
  };
}
