import { ItemPedido, StatusItem } from "../entities/item-pedido.entity";
import { Pedido, StatusPreparo } from "../entities/pedido.entity";

export interface PedidoCreatedResponse {
  pedido_id: string;
  status_preparo: StatusPreparo;
  mensagem: string;
}

export function toPedidoCreatedResponse(pedido: Pedido): PedidoCreatedResponse {
  return {
    pedido_id: pedido.id,
    status_preparo: pedido.statusPreparo,
    mensagem: "Pedido enviado e enfileirado para impressão.",
  };
}

export interface PedidoItemResponse {
  id: string;
  produto_nome: string;
  quantidade: number;
  integrante_nome: string | null;
  observacao: string | null;
  status_item: StatusItem;
  precisa_preparo: boolean;
}

export interface PedidoListItemResponse {
  id: string;
  comanda_id: string;
  numero_comanda: number;
  garcom_nome: string;
  status_preparo: StatusPreparo;
  criado_em: Date;
  itens: PedidoItemResponse[];
}

export function toPedidoListItemResponse(pedido: Pedido): PedidoListItemResponse {
  return {
    id: pedido.id,
    comanda_id: pedido.comandaId,
    numero_comanda: pedido.comanda.numeroComanda,
    garcom_nome: pedido.usuario.nome,
    status_preparo: pedido.statusPreparo,
    criado_em: pedido.criadoEm,
    itens: (pedido.itens ?? []).map((item) => ({
      id: item.id,
      produto_nome: item.produto.nome,
      quantidade: item.quantidade,
      integrante_nome: item.integrante?.nome ?? null,
      observacao: item.observacao,
      status_item: item.statusItem,
      precisa_preparo: item.produto.precisaPreparo,
    })),
  };
}

export interface UpdateItemStatusResponse {
  item_id: string;
  status_item: StatusItem;
  pedido: {
    id: string;
    status_preparo: StatusPreparo;
  };
}

export function toUpdateItemStatusResponse(item: ItemPedido, pedido: Pedido): UpdateItemStatusResponse {
  return {
    item_id: item.id,
    status_item: item.statusItem,
    pedido: {
      id: pedido.id,
      status_preparo: pedido.statusPreparo,
    },
  };
}
