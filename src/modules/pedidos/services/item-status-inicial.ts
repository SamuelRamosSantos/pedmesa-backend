import { StatusItem } from "../entities/item-pedido.entity";

export function resolveStatusItemInicial(precisaPreparo: boolean): StatusItem {
  return precisaPreparo ? StatusItem.PENDENTE : StatusItem.PRONTO;
}
