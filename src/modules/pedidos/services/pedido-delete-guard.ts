import { AppError } from "../../../shared/errors/app-error";
import { UserRole } from "../../usuarios/entities/user.entity";
import { StatusItem } from "../entities/item-pedido.entity";

export interface ItemParaExclusaoPedido {
  statusItem: StatusItem;
  precisaPreparo: boolean;
}

export interface AssertPodeExcluirPedidoParams {
  itens: ItemParaExclusaoPedido[];
  pedidoUsuarioId: string;
  actingUserId: string;
  actingUserRoles: UserRole[];
}

// Item que precisa de preparo só pode ser excluído enquanto a cozinha não começou (pendente).
// Item auto-pronto (não precisa de preparo) nasce "pronto" e nunca passa por pendente,
// então para ele o corte é não ter sido entregue ainda ao cliente.
function itemBloqueiaExclusaoPedido(item: ItemParaExclusaoPedido): boolean {
  if (item.statusItem === StatusItem.CANCELADO) {
    return false;
  }

  if (item.precisaPreparo) {
    return item.statusItem !== StatusItem.PENDENTE;
  }

  return item.statusItem === StatusItem.ENTREGUE;
}

export function assertPodeExcluirPedido(params: AssertPodeExcluirPedidoParams): void {
  const isAdmin = params.actingUserRoles.includes(UserRole.ADMIN);
  const isDono = params.pedidoUsuarioId === params.actingUserId;

  if (!isAdmin && !isDono) {
    throw new AppError("Você só pode excluir pedidos que você mesmo lançou.", 403);
  }

  if (params.itens.some(itemBloqueiaExclusaoPedido)) {
    throw new AppError(
      "Só é possível excluir o pedido enquanto os itens que precisam de preparo estiverem pendentes e os demais ainda não tiverem sido entregues.",
      400
    );
  }
}
