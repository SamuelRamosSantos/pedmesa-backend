import { AppError } from "../errors/app-error";
import { toCents } from "./money";

// Maior valor que cabe numa coluna decimal(10,2).
export const VALOR_REAIS_MAXIMO = 99_999_999.99;

// Valor em reais vindo do cliente: número finito, não negativo, até 2 casas decimais e
// dentro do limite de decimal(10,2). Recusar 7.555 evita que o banco arredonde em
// silêncio um valor que a tela mostrou diferente.
export function validarValorReais(valor: unknown, campo: string): number {
  if (typeof valor !== "number" || !Number.isFinite(valor) || valor < 0) {
    throw new AppError(`${campo} deve ser um número maior ou igual a zero.`, 400);
  }

  if (valor > VALOR_REAIS_MAXIMO) {
    throw new AppError(`${campo} deve ser no máximo ${VALOR_REAIS_MAXIMO}.`, 400);
  }

  if (Math.abs(valor * 100 - toCents(valor)) > 1e-6) {
    throw new AppError(`${campo} deve ter no máximo 2 casas decimais.`, 400);
  }

  return valor;
}
