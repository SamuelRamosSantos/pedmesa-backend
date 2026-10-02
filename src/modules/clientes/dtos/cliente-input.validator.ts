import { AppError } from "../../../shared/errors/app-error";
import { normalizarTelefone } from "../services/telefone-normalizer";

export const NOME_CLIENTE_MAX = 120;
export const OBSERVACOES_CLIENTE_MAX = 500;

export function validarNomeCliente(nome: unknown): string {
  return validarTextoObrigatorio(nome, "nome", NOME_CLIENTE_MAX);
}

export function validarTelefoneCliente(telefone: unknown): string {
  const telefoneNormalizado = typeof telefone === "string" ? normalizarTelefone(telefone) : null;

  if (telefoneNormalizado === null) {
    throw new AppError("telefone inválido: informe DDD + número (fixo ou celular).", 400);
  }

  return telefoneNormalizado;
}

export function validarObservacoesCliente(observacoes: unknown): string | null {
  return validarTextoOpcional(observacoes, "observacoes", OBSERVACOES_CLIENTE_MAX);
}

// Texto obrigatório: aparado, não vazio e dentro do limite do banco.
export function validarTextoObrigatorio(valor: unknown, campo: string, maximo: number): string {
  if (typeof valor !== "string" || valor.trim().length === 0) {
    throw new AppError(`${campo} é obrigatório.`, 400);
  }

  const valorLimpo = valor.trim();

  if (valorLimpo.length > maximo) {
    throw new AppError(`${campo} deve ter no máximo ${maximo} caracteres.`, 400);
  }

  return valorLimpo;
}

// Texto opcional: ausente, null ou só espaços viram null, para "sem valor" ter uma
// única representação no banco.
export function validarTextoOpcional(valor: unknown, campo: string, maximo: number): string | null {
  if (valor === undefined || valor === null) {
    return null;
  }

  if (typeof valor !== "string") {
    throw new AppError(`${campo} deve ser um texto.`, 400);
  }

  const valorLimpo = valor.trim();

  if (valorLimpo.length > maximo) {
    throw new AppError(`${campo} deve ter no máximo ${maximo} caracteres.`, 400);
  }

  return valorLimpo.length > 0 ? valorLimpo : null;
}
