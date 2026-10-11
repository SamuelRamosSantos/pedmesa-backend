import { Cliente } from "../entities/cliente.entity";
import { EnderecoCliente } from "../entities/endereco-cliente.entity";

export interface EnderecoClienteResponse {
  id: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  referencia: string | null;
  principal: boolean;
  criado_em: Date;
}

export interface ClienteResponse {
  id: string;
  nome: string;
  telefone: string;
  observacoes: string | null;
  ativo: boolean;
  criado_em: Date;
  atualizado_em: Date;
  enderecos: EnderecoClienteResponse[];
}

export function toEnderecoClienteResponse(endereco: EnderecoCliente): EnderecoClienteResponse {
  return {
    id: endereco.id,
    cep: endereco.cep,
    logradouro: endereco.logradouro,
    numero: endereco.numero,
    complemento: endereco.complemento,
    bairro: endereco.bairro,
    cidade: endereco.cidade,
    uf: endereco.uf,
    referencia: endereco.referencia,
    principal: endereco.principal,
    criado_em: endereco.criadoEm,
  };
}

export function toClienteResponse(cliente: Cliente, enderecos: EnderecoCliente[]): ClienteResponse {
  return {
    id: cliente.id,
    nome: cliente.nome,
    telefone: cliente.telefone,
    observacoes: cliente.observacoes,
    ativo: cliente.ativo,
    criado_em: cliente.criadoEm,
    atualizado_em: cliente.atualizadoEm,
    enderecos: enderecos.map(toEnderecoClienteResponse),
  };
}
