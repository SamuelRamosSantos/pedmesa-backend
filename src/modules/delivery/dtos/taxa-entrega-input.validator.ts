import { AppError } from "../../../shared/errors/app-error";
import { validarValorReais } from "../../../shared/utils/validar-valor-reais";
import { validarTextoObrigatorio } from "../../clientes/dtos/cliente-input.validator";

// Limites iguais aos das colunas de taxas_entrega (migration 027).
export const validarCidadeTaxa = (valor: unknown) => validarTextoObrigatorio(valor, "cidade", 120);
export const validarBairroTaxa = (valor: unknown) => validarTextoObrigatorio(valor, "bairro", 120);
export const validarValorTaxa = (valor: unknown) => validarValorReais(valor, "valor");

// Minutos estimados de entrega: inteiro positivo, ou null para "sem estimativa".
export function validarTempoEstimadoMin(valor: unknown): number | null {
  if (valor === null) {
    return null;
  }

  if (typeof valor !== "number" || !Number.isInteger(valor) || valor <= 0 || valor > 24 * 60) {
    throw new AppError("tempo_estimado_min deve ser um número inteiro de minutos entre 1 e 1440, ou null.", 400);
  }

  return valor;
}

export function validarAtivoTaxa(valor: unknown): boolean {
  if (typeof valor !== "boolean") {
    throw new AppError("ativo deve ser true ou false.", 400);
  }

  return valor;
}
