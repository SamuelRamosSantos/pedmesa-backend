import { AppError } from "../../../shared/errors/app-error";
import { validarNomeCliente, validarObservacoesCliente, validarTelefoneCliente } from "./cliente-input.validator";

export interface UpdateClienteDto {
  nome?: string;
  telefone?: string;
  observacoes?: string | null;
}

// Atualização parcial: só os campos enviados são validados e alterados.
// observacoes: null limpa o campo; ausente mantém o valor atual.
export function assertValidUpdateClienteDto(body: unknown): UpdateClienteDto {
  const campos = (body ?? {}) as Record<string, unknown>;
  const dto: UpdateClienteDto = {};

  if (campos.nome !== undefined) {
    dto.nome = validarNomeCliente(campos.nome);
  }

  if (campos.telefone !== undefined) {
    dto.telefone = validarTelefoneCliente(campos.telefone);
  }

  if ("observacoes" in campos) {
    dto.observacoes = validarObservacoesCliente(campos.observacoes);
  }

  if (Object.keys(dto).length === 0) {
    throw new AppError("Informe ao menos um campo para atualizar: nome, telefone ou observacoes.", 400);
  }

  return dto;
}
