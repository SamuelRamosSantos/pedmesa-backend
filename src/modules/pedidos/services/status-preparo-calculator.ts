import { StatusItem } from "../entities/item-pedido.entity";
import { StatusPreparo } from "../entities/pedido.entity";

export function calcularStatusPreparoPedido(statusDosItens: StatusItem[]): StatusPreparo {
  const itensAtivos = statusDosItens.filter((status) => status !== StatusItem.CANCELADO);

  if (itensAtivos.length === 0) {
    return StatusPreparo.ENTREGUE;
  }

  if (itensAtivos.every((status) => status === StatusItem.ENTREGUE)) {
    return StatusPreparo.ENTREGUE;
  }

  if (itensAtivos.every((status) => status === StatusItem.PRONTO || status === StatusItem.ENTREGUE)) {
    return StatusPreparo.PRONTO;
  }

  if (itensAtivos.every((status) => status === StatusItem.PENDENTE)) {
    return StatusPreparo.PENDENTE;
  }

  return StatusPreparo.EM_PREPARO;
}
