import { AppError } from "../../../shared/errors/app-error";
import { normalizarCep } from "../services/cep-normalizer";
import { validarTextoObrigatorio, validarTextoOpcional } from "./cliente-input.validator";

const UFS_VALIDAS: ReadonlySet<string> = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]);

export interface CreateEnderecoClienteDto {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  referencia: string | null;
  principal: boolean;
}

function validarCep(cep: unknown): string {
  const cepNormalizado = typeof cep === "string" ? normalizarCep(cep) : null;

  if (cepNormalizado === null) {
    throw new AppError("cep inválido: informe os 8 dígitos.", 400);
  }

  return cepNormalizado;
}

function validarUf(uf: unknown): string {
  const ufMaiuscula = typeof uf === "string" ? uf.trim().toUpperCase() : "";

  if (!UFS_VALIDAS.has(ufMaiuscula)) {
    throw new AppError("uf inválida: informe a sigla do estado (ex.: SP).", 400);
  }

  return ufMaiuscula;
}

function validarPrincipal(principal: unknown): boolean {
  if (principal === undefined) {
    return false;
  }

  if (typeof principal !== "boolean") {
    throw new AppError("principal deve ser true ou false.", 400);
  }

  return principal;
}

export function assertValidCreateEnderecoClienteDto(body: unknown): CreateEnderecoClienteDto {
  const { cep, logradouro, numero, complemento, bairro, cidade, uf, referencia, principal } = (body ?? {}) as Record<
    string,
    unknown
  >;

  return {
    cep: validarCep(cep),
    logradouro: validarTextoObrigatorio(logradouro, "logradouro", 255),
    numero: validarTextoObrigatorio(numero, "numero", 20),
    complemento: validarTextoOpcional(complemento, "complemento", 100),
    bairro: validarTextoObrigatorio(bairro, "bairro", 120),
    cidade: validarTextoObrigatorio(cidade, "cidade", 120),
    uf: validarUf(uf),
    referencia: validarTextoOpcional(referencia, "referencia", 255),
    principal: validarPrincipal(principal),
  };
}
