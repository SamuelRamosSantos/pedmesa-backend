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
