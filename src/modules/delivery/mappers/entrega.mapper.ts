import { FormaPagamento } from "../../comandas/entities/pagamento-comanda.entity";
import { StatusPreparo } from "../../pedidos/entities/pedido.entity";
import { Entrega, StatusEntrega } from "../entities/entrega.entity";
import { CardPainelEntrega } from "../services/painel-entrega";

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

// Card do Kanban da expedição (PED-101).
export interface EntregaPainelResponse {
  id: string;
  numero_entrega: number;
  status_entrega: StatusEntrega;
  versao: number;
  cliente: { nome: string; telefone: string };
  bairro: string;
  endereco_resumido: string;
  total: number;
  forma_pagamento_prevista: FormaPagamento;
  troco: number;
  troco_suficiente: boolean;
  criado_em: Date;
  previsao_entrega_em: Date | null;
  atrasado: boolean;
  status_preparo: StatusPreparo;
}

export function toEntregaPainelResponse(card: CardPainelEntrega): EntregaPainelResponse {
  return {
    id: card.id,
    numero_entrega: card.numeroEntrega,
    status_entrega: card.statusEntrega,
    versao: card.versao,
    cliente: { nome: card.cliente.nome, telefone: card.cliente.telefone },
    bairro: card.bairro,
    endereco_resumido: card.enderecoResumido,
    total: card.total,
    forma_pagamento_prevista: card.formaPagamentoPrevista,
    troco: card.troco,
    troco_suficiente: card.trocoSuficiente,
    criado_em: card.criadoEm,
    previsao_entrega_em: card.previsaoEntregaEm,
    atrasado: card.atrasado,
    status_preparo: card.statusPreparo,
  };
}
