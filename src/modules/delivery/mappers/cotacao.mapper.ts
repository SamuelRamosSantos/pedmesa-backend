import { CotacaoPedido } from "../services/cotacao-pedido";

export interface CotacaoResponse {
  atendido: boolean;
  motivo_nao_atendido: string | null;
  subtotal: number;
  taxa_entrega: number | null;
  // PED-126: taxa do bairro antes da isenção e se ela foi isentada.
  taxa_entrega_bairro: number | null;
  taxa_isenta: boolean;
  origem_taxa: "bairro" | "padrao" | null;
  tempo_estimado_min: number | null;
  desconto_aplicado: number;
  desconto_excede_itens: boolean;
  total: number;
  pedido_minimo: number;
  pedido_minimo_atingido: boolean;
  troco: number;
  troco_suficiente: boolean;
}

export function toCotacaoResponse(cotacao: CotacaoPedido): CotacaoResponse {
  return {
    atendido: cotacao.atendido,
    motivo_nao_atendido: cotacao.motivoNaoAtendido,
    subtotal: cotacao.subtotal,
    taxa_entrega: cotacao.taxaEntrega,
    taxa_entrega_bairro: cotacao.taxaEntregaBairro,
    taxa_isenta: cotacao.taxaIsenta,
    origem_taxa: cotacao.origemTaxa,
    tempo_estimado_min: cotacao.tempoEstimadoMin,
    desconto_aplicado: cotacao.descontoAplicado,
    desconto_excede_itens: cotacao.descontoExcedeItens,
    total: cotacao.total,
    pedido_minimo: cotacao.pedidoMinimo,
    pedido_minimo_atingido: cotacao.pedidoMinimoAtingido,
    troco: cotacao.troco,
    troco_suficiente: cotacao.trocoSuficiente,
  };
}
