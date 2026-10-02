import { validarNomeCliente, validarObservacoesCliente, validarTelefoneCliente } from "./cliente-input.validator";

export interface CreateClienteDto {
  nome: string;
  telefone: string;
  observacoes: string | null;
}

export function assertValidCreateClienteDto(body: unknown): CreateClienteDto {
  const { nome, telefone, observacoes } = (body ?? {}) as Record<string, unknown>;

  return {
    nome: validarNomeCliente(nome),
    telefone: validarTelefoneCliente(telefone),
    observacoes: validarObservacoesCliente(observacoes),
  };
}
