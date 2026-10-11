import { AppError } from "../../../shared/errors/app-error";
import { toCents } from "../../../shared/utils/money";
import { validarValorReais } from "../../../shared/utils/validar-valor-reais";
import { validarBairro, validarCidade } from "../../clientes/dtos/endereco-input.validator";
import { validarFormaPagamento } from "../../comandas/dtos/forma-pagamento.validator";
import { FormaPagamento } from "../../comandas/entities/pagamento-comanda.entity";
import { assertValidCreatePedidoDto, CreatePedidoItemInput } from "../../pedidos/dtos/create-pedido.dto";

export interface CotacaoDeliveryDto {
  endereco: { cidade: string; bairro: string };
  itens: CreatePedidoItemInput[];
  formaPagamento: FormaPagamento;
  trocoParaCents: number | null;
}

// POST /delivery/cotacao. Recebe só a intenção do cliente: endereço, itens, forma de
// pagamento e "troco para". Preço, taxa e total são calculados no servidor; um
// taxa_entrega ou total enviado no corpo é ignorado.
export function assertValidCotacaoDeliveryDto(body: unknown): CotacaoDeliveryDto {
  const { endereco, itens, forma_pagamento: formaPagamento, troco_para: trocoPara } = (body ?? {}) as Record<string, unknown>;

  if (typeof endereco !== "object" || endereco === null) {
    throw new AppError("endereco é obrigatório (com cidade e bairro).", 400);
  }

  const { cidade, bairro } = endereco as Record<string, unknown>;

  return {
    endereco: { cidade: validarCidade(cidade), bairro: validarBairro(bairro) },
    itens: assertValidCreatePedidoDto({ itens }).itens,
    formaPagamento: validarFormaPagamento(formaPagamento, "forma_pagamento"),
    trocoParaCents: trocoPara === undefined || trocoPara === null ? null : toCents(validarValorReais(trocoPara, "troco_para")),
  };
}
