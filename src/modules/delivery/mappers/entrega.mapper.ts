import { Entrega, StatusEntrega } from "../entities/entrega.entity";

// Estado da entrega para o painel (resposta da transição e corpo do 409 de concorrência).
export interface EntregaEstadoResponse {
  id: string;
  numero_entrega: number;
  status_entrega: StatusEntrega;
  versao: number;
  previsao_entrega_em: Date | null;
  saiu_em: Date | null;
  entregue_em: Date | null;
  motivo_cancelamento: string | null;
}

export function toEntregaEstadoResponse(entrega: Entrega): EntregaEstadoResponse {
  return {
    id: entrega.id,
    numero_entrega: entrega.numeroEntrega,
    status_entrega: entrega.statusEntrega,
    versao: entrega.versao,
    previsao_entrega_em: entrega.previsaoEntregaEm,
    saiu_em: entrega.saiuEm,
    entregue_em: entrega.entregueEm,
    motivo_cancelamento: entrega.motivoCancelamento,
  };
}
