import { StatusEntrega } from "../entities/entrega.entity";
import { PedidoDeliveryCriado } from "../services/pedido-delivery.service";

export interface PedidoDeliveryCriadoResponse {
  entrega_id: string;
  comanda_id: string;
  numero_entrega: number;
  status_entrega: StatusEntrega;
  subtotal: number;
  taxa_entrega: number;
  total: number;
  troco: number;
  previsao_entrega_em: Date | null;
}

export function toPedidoDeliveryCriadoResponse({ entrega, cotacao }: PedidoDeliveryCriado): PedidoDeliveryCriadoResponse {
  return {
    entrega_id: entrega.id,
    comanda_id: entrega.comandaId,
    numero_entrega: entrega.numeroEntrega,
    status_entrega: entrega.statusEntrega,
    subtotal: cotacao.subtotal,
    taxa_entrega: entrega.taxaEntrega,
    total: cotacao.total,
    troco: cotacao.troco,
    previsao_entrega_em: entrega.previsaoEntregaEm,
  };
}
