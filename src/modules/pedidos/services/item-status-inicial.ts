import { StatusItem } from "../entities/item-pedido.entity";

export function resolveStatusItemInicial(precisaPreparo: boolean, usaModuloCozinha: boolean): StatusItem {
  return precisaPreparo && usaModuloCozinha ? StatusItem.PENDENTE : StatusItem.PRONTO;
}
