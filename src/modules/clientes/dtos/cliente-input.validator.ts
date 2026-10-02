import { AppError } from "../../../shared/errors/app-error";
import { normalizarTelefone } from "../services/telefone-normalizer";

export const NOME_CLIENTE_MAX = 120;
export const OBSERVACOES_CLIENTE_MAX = 500;

export function validarNomeCliente(nome: unknown): string {
  if (typeof nome !== "string" || nome.trim().length === 0) {
    throw new AppError("nome é obrigatório.", 400);
  }

  const nomeLimpo = nome.trim();

  if (nomeLimpo.length > NOME_CLIENTE_MAX) {
    throw new AppError(`nome deve ter no máximo ${NOME_CLIENTE_MAX} caracteres.`, 400);
  }

  return nomeLimpo;
}

export function validarTelefoneCliente(telefone: unknown): string {
  const telefoneNormalizado = typeof telefone === "string" ? normalizarTelefone(telefone) : null;

  if (telefoneNormalizado === null) {
    throw new AppError("telefone inválido: informe DDD + número (fixo ou celular).", 400);
  }

  return telefoneNormalizado;
}

// Ausente, null ou só espaços viram null: "sem observação" tem uma única representação.
export function validarObservacoesCliente(observacoes: unknown): string | null {
  if (observacoes === undefined || observacoes === null) {
    return null;
  }

  if (typeof observacoes !== "string") {
    throw new AppError("observacoes deve ser um texto.", 400);
  }

  const observacoesLimpas = observacoes.trim();

  if (observacoesLimpas.length > OBSERVACOES_CLIENTE_MAX) {
    throw new AppError(`observacoes deve ter no máximo ${OBSERVACOES_CLIENTE_MAX} caracteres.`, 400);
  }

  return observacoesLimpas.length > 0 ? observacoesLimpas : null;
}
