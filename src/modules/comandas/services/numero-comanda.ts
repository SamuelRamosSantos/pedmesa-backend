import { AppError } from "../../../shared/errors/app-error";

// Comandas de delivery não têm número de mesa (ADR-001). Enquanto impressão e log de
// exclusão ainda gravam o número em colunas NOT NULL (PED-102 e PED-103), os pontos
// que dependem dele recusam delivery de forma explícita em vez de gravar dado inválido.
export function exigirNumeroDaMesa(numeroComanda: number | null): number {
  if (numeroComanda === null) {
    throw new AppError("Esta operação ainda não está disponível para pedidos de delivery.", 400);
  }

  return numeroComanda;
}
