import { AppError } from "../../../shared/errors/app-error";
import { normalizarCep } from "../services/cep-normalizer";
import { validarTextoObrigatorio, validarTextoOpcional } from "./cliente-input.validator";

const UFS_VALIDAS: ReadonlySet<string> = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]);

export function validarCep(cep: unknown): string {
  const cepNormalizado = typeof cep === "string" ? normalizarCep(cep) : null;

  if (cepNormalizado === null) {
    throw new AppError("cep inválido: informe os 8 dígitos.", 400);
  }

  return cepNormalizado;
}

export function validarUf(uf: unknown): string {
  const ufMaiuscula = typeof uf === "string" ? uf.trim().toUpperCase() : "";

  if (!UFS_VALIDAS.has(ufMaiuscula)) {
    throw new AppError("uf inválida: informe a sigla do estado (ex.: SP).", 400);
  }

  return ufMaiuscula;
}

export function validarBooleano(valor: unknown, campo: string): boolean {
  if (typeof valor !== "boolean") {
    throw new AppError(`${campo} deve ser true ou false.`, 400);
  }

  return valor;
}

// Limites iguais aos das colunas de enderecos_cliente (migration 026).
export const validarLogradouro = (valor: unknown) => validarTextoObrigatorio(valor, "logradouro", 255);
export const validarNumero = (valor: unknown) => validarTextoObrigatorio(valor, "numero", 20);
export const validarComplemento = (valor: unknown) => validarTextoOpcional(valor, "complemento", 100);
export const validarBairro = (valor: unknown) => validarTextoObrigatorio(valor, "bairro", 120);
export const validarCidade = (valor: unknown) => validarTextoObrigatorio(valor, "cidade", 120);
export const validarReferencia = (valor: unknown) => validarTextoOpcional(valor, "referencia", 255);
