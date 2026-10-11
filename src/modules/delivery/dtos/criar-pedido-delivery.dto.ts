import { AppError } from "../../../shared/errors/app-error";
import { isUuid } from "../../../shared/utils/is-uuid";
import { toCents } from "../../../shared/utils/money";
import { validarValorReais } from "../../../shared/utils/validar-valor-reais";
import { CreateClienteDto, assertValidCreateClienteDto } from "../../clientes/dtos/create-cliente.dto";
import { assertValidCreateEnderecoClienteDto, CreateEnderecoClienteDto } from "../../clientes/dtos/create-endereco-cliente.dto";
import { validarBooleano } from "../../clientes/dtos/endereco-input.validator";
import { validarFormaPagamento } from "../../comandas/dtos/forma-pagamento.validator";
import { FormaPagamento } from "../../comandas/entities/pagamento-comanda.entity";
import { assertValidCreatePedidoDto, CreatePedidoItemInput } from "../../pedidos/dtos/create-pedido.dto";

export type EnderecoNovo = Omit<CreateEnderecoClienteDto, "principal">;

// Exatamente uma das formas: um endereço salvo do cliente (endereco_id) ou um endereço novo.
export type EnderecoDoPedido =
  | { tipo: "salvo"; enderecoId: string }
  | { tipo: "novo"; endereco: EnderecoNovo; salvarNoCadastro: boolean };

export interface CriarPedidoDeliveryDto {
  cliente: CreateClienteDto;
  endereco: EnderecoDoPedido;
  itens: CreatePedidoItemInput[];
  formaPagamento: FormaPagamento;
  trocoParaCents: number | null;
}

function validarEndereco(enderecoId: unknown, endereco: unknown, salvarEndereco: unknown): EnderecoDoPedido {
  const temId = enderecoId !== undefined && enderecoId !== null;
  const temNovo = endereco !== undefined && endereco !== null;

  if (temId === temNovo) {
    throw new AppError("Informe endereco_id (endereço salvo do cliente) ou endereco (endereço novo), um dos dois.", 400);
  }

  if (temId) {
    if (!isUuid(enderecoId)) {
      throw new AppError("endereco_id inválido.", 400);
    }
    return { tipo: "salvo", enderecoId };
  }

  const { principal: _ignorado, ...enderecoNovo } = assertValidCreateEnderecoClienteDto(endereco);

  return {
    tipo: "novo",
    endereco: enderecoNovo,
    salvarNoCadastro: salvarEndereco === undefined ? false : validarBooleano(salvarEndereco, "salvar_endereco"),
  };
}

// POST /delivery/pedidos. Só a intenção do atendente: cliente, endereço, itens, forma de
// pagamento e "troco para". Preço, taxa, total e status são calculados no servidor; campos
// como taxa_entrega, total ou tenant_id no corpo são ignorados. integrante_id dos itens
// também é ignorado: no delivery os itens são do cliente.
export function assertValidCriarPedidoDeliveryDto(body: unknown): CriarPedidoDeliveryDto {
  const {
    cliente,
    endereco_id: enderecoId,
    endereco,
    salvar_endereco: salvarEndereco,
    itens,
    forma_pagamento: formaPagamento,
    troco_para: trocoPara,
  } = (body ?? {}) as Record<string, unknown>;

  if (typeof cliente !== "object" || cliente === null) {
    throw new AppError("cliente é obrigatório (com telefone e nome).", 400);
  }

  return {
    cliente: assertValidCreateClienteDto(cliente),
    endereco: validarEndereco(enderecoId, endereco, salvarEndereco),
    itens: assertValidCreatePedidoDto({ itens }).itens.map((item) => ({ ...item, integranteId: null })),
    formaPagamento: validarFormaPagamento(formaPagamento, "forma_pagamento"),
    trocoParaCents: trocoPara === undefined || trocoPara === null ? null : toCents(validarValorReais(trocoPara, "troco_para")),
  };
}
