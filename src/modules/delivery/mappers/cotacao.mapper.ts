import { CotacaoPedido } from "../services/cotacao-pedido";

export interface CotacaoResponse {
  atendido: boolean;
  motivo_nao_atendido: string | null;
  subtotal: number;
  taxa_entrega: number | null;
  origem_taxa: "bairro" | "padrao" | null;
  tempo_estimado_min: number | null;
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
    origem_taxa: cotacao.origemTaxa,
    tempo_estimado_min: cotacao.tempoEstimadoMin,
    total: cotacao.total,
    pedido_minimo: cotacao.pedidoMinimo,
    pedido_minimo_atingido: cotacao.pedidoMinimoAtingido,
    troco: cotacao.troco,
    troco_suficiente: cotacao.trocoSuficiente,
  };
}
