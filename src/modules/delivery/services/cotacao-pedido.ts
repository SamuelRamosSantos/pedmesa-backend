import { fromCents, toCents } from "../../../shared/utils/money";
import { FormaPagamento } from "../../comandas/entities/pagamento-comanda.entity";
import { CotacaoFrete } from "./frete";
import { calcularTroco } from "./troco-calculator";

export interface ItemCotado {
  quantidade: number;
  precoUnitario: number;
}

export function somarSubtotalCents(itens: readonly ItemCotado[]): number {
  return itens.reduce((soma, item) => soma + toCents(item.precoUnitario) * item.quantidade, 0);
}

export interface MontarCotacaoParams {
  subtotalCents: number;
  frete: CotacaoFrete;
  pedidoMinimoCents: number;
  formaPagamento: FormaPagamento;
  trocoParaCents: number | null;
}

export interface CotacaoPedido {
  atendido: boolean;
  motivoNaoAtendido: string | null;
  subtotal: number;
  taxaEntrega: number | null;
  origemTaxa: "bairro" | "padrao" | null;
  tempoEstimadoMin: number | null;
  total: number;
  pedidoMinimo: number;
  pedidoMinimoAtingido: boolean;
  troco: number;
  trocoSuficiente: boolean;
}

// Cotação do pedido delivery (PED-93): a MESMA função é usada pela tela (só exibe) e pela
// criação do pedido (PED-96, que recusa o que não pode ser criado). Não lança erro por
// bairro não atendido, pedido mínimo ou troco insuficiente: devolve os sinais para quem
// chamou decidir. Só lança para troco informado em pagamento que não é dinheiro.
//
// - total = itens + taxa (sem bairro atendido, a taxa não existe e o total é só dos itens);
// - pedido mínimo é comparado com o valor dos itens, sem a taxa.
export function montarCotacaoPedido({
  subtotalCents,
  frete,
  pedidoMinimoCents,
  formaPagamento,
  trocoParaCents,
}: MontarCotacaoParams): CotacaoPedido {
  const taxaCents = frete.atendido ? toCents(frete.valor) : 0;
  const totalCents = subtotalCents + taxaCents;
  const troco = calcularTroco({ totalCents, formaPrevista: formaPagamento, trocoParaCents });

  return {
    atendido: frete.atendido,
    motivoNaoAtendido: frete.atendido ? null : frete.motivo,
    subtotal: fromCents(subtotalCents),
    taxaEntrega: frete.atendido ? fromCents(taxaCents) : null,
    origemTaxa: frete.atendido ? frete.origem : null,
    tempoEstimadoMin: frete.atendido ? frete.tempoEstimadoMin : null,
    total: fromCents(totalCents),
    pedidoMinimo: fromCents(pedidoMinimoCents),
    pedidoMinimoAtingido: subtotalCents >= pedidoMinimoCents,
    troco: fromCents(troco.trocoCents),
    trocoSuficiente: troco.suficiente,
  };
}
