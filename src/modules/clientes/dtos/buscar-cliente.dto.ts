import { validarTelefoneCliente } from "./cliente-input.validator";

export interface BuscarClienteQuery {
  telefone: string;
}

// GET /clientes?telefone=…: o telefone vem como digitado no formulário e é normalizado
// aqui, para a busca usar a mesma chave gravada no banco.
export function assertValidBuscarClienteQuery(query: unknown): BuscarClienteQuery {
  const { telefone } = (query ?? {}) as Record<string, unknown>;

  return { telefone: validarTelefoneCliente(telefone) };
}
