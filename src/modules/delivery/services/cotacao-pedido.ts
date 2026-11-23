import { fromCents, toCents } from "../../../shared/utils/money";
import { DescontoTipo } from "../../comandas/entities/comanda.entity";
import { FormaPagamento } from "../../comandas/entities/pagamento-comanda.entity";
import { DescontoInput } from "../../comandas/services/desconto-calculator";
import { CotacaoFrete } from "./frete";
import { calcularTroco } from "./troco-calculator";

export interface ItemCotado {
  quantidade: number;
  precoUnitario: number;
}

export function somarSubtotalCents(itens: readonly ItemCotado[]): number {
  return itens.reduce(
    (soma, item) => soma + toCents(item.precoUnitario) * item.quantidade,
    0,
  );
}

export interface MontarCotacaoParams {
  subtotalCents: number;
  frete: CotacaoFrete;
  pedidoMinimoCents: number;
  formaPagamento: FormaPagamento;
  trocoParaCents: number | null;
  // PED-126: desconto nos itens e isenção da taxa. Ausentes = sem ajuste.
  desconto?: DescontoInput;
  isentarTaxa?: boolean;
}

export interface CotacaoPedido {
  atendido: boolean;
  motivoNaoAtendido: string | null;
  subtotal: number;
  // Taxa cobrada (0 quando isenta); null sem bairro atendido.
  taxaEntrega: number | null;
  // Taxa do bairro antes da isenção, para a tela mostrar o que deixou de ser cobrado.
  taxaEntregaBairro: number | null;
  taxaIsenta: boolean;
  origemTaxa: "bairro" | "padrao" | null;
  tempoEstimadoMin: number | null;
  descontoAplicado: number;
  // Desconto maior que os itens: a cotação mostra o total sem ele e a criação recusa.
  descontoExcedeItens: boolean;
  total: number;
  pedidoMinimo: number;
  pedidoMinimoAtingido: boolean;
  troco: number;
  trocoSuficiente: boolean;
}

// Mesmo cálculo de calcularDesconto (fechamento da comanda), sem lançar erro: a cotação
// só sinaliza o desconto inválido.
function descontoEmCents(
  subtotalCents: number,
  desconto: DescontoInput,
): number {
  switch (desconto.tipo) {
    case DescontoTipo.NENHUM:
      return 0;
    case DescontoTipo.PERCENTUAL:
      return Math.round((subtotalCents * desconto.valor) / 100);
    case DescontoTipo.VALOR_FIXO:
      return toCents(desconto.valor);
  }
}

// Cotação do pedido delivery (PED-93): a MESMA função é usada pela tela (só exibe) e pela
// criação do pedido (PED-96, que recusa o que não pode ser criado). Não lança erro por
// bairro não atendido, pedido mínimo, troco insuficiente ou desconto inválido: devolve os
// sinais para quem chamou decidir. Só lança para troco em pagamento que não é dinheiro.
//
// - total = itens − desconto + taxa (ADR-001: o desconto incide só sobre os itens);
// - taxa isenta (PED-126) entra como 0; sem bairro atendido, a taxa não existe;
// - pedido mínimo é comparado com o valor dos itens, sem taxa e antes do desconto.
export function montarCotacaoPedido({
  subtotalCents,
  frete,
  pedidoMinimoCents,
  formaPagamento,
  trocoParaCents,
  desconto = { tipo: DescontoTipo.NENHUM, valor: 0 },
  isentarTaxa = false,
}: MontarCotacaoParams): CotacaoPedido {
  const taxaBairroCents = frete.atendido ? toCents(frete.valor) : 0;
  const taxaCents = isentarTaxa ? 0 : taxaBairroCents;
  const descontoCalculadoCents = descontoEmCents(subtotalCents, desconto);
  const descontoExcedeItens = descontoCalculadoCents > subtotalCents;
  const descontoCents = descontoExcedeItens ? 0 : descontoCalculadoCents;
  const totalCents = subtotalCents - descontoCents + taxaCents;
  const troco = calcularTroco({
    totalCents,
    formaPrevista: formaPagamento,
    trocoParaCents,
  });

  return {
    atendido: frete.atendido,
    motivoNaoAtendido: frete.atendido ? null : frete.motivo,
    subtotal: fromCents(subtotalCents),
    taxaEntrega: frete.atendido ? fromCents(taxaCents) : null,
    taxaEntregaBairro: frete.atendido ? fromCents(taxaBairroCents) : null,
    taxaIsenta: frete.atendido && isentarTaxa,
    origemTaxa: frete.atendido ? frete.origem : null,
    tempoEstimadoMin: frete.atendido ? frete.tempoEstimadoMin : null,
    descontoAplicado: fromCents(descontoCents),
    descontoExcedeItens,
    total: fromCents(totalCents),
    pedidoMinimo: fromCents(pedidoMinimoCents),
    pedidoMinimoAtingido: subtotalCents >= pedidoMinimoCents,
    troco: fromCents(troco.trocoCents),
    trocoSuficiente: troco.suficiente,
  };
}
