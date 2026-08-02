import { AppError } from "../../../shared/errors/app-error";
import { StatusItem } from "../entities/item-pedido.entity";

const TRANSICOES_VALIDAS: Record<StatusItem, StatusItem[]> = {
  [StatusItem.PENDENTE]: [StatusItem.EM_PREPARO, StatusItem.CANCELADO],
  [StatusItem.EM_PREPARO]: [StatusItem.PENDENTE, StatusItem.PRONTO, StatusItem.CANCELADO],
  [StatusItem.PRONTO]: [StatusItem.EM_PREPARO, StatusItem.ENTREGUE],
  [StatusItem.ENTREGUE]: [StatusItem.PRONTO],
  [StatusItem.CANCELADO]: [StatusItem.PENDENTE],
};

export function assertTransicaoValida(statusAtual: StatusItem, statusNovo: StatusItem): void {
  if (statusAtual === statusNovo) {
    throw new AppError(`O item já está com o status "${statusNovo}".`, 400);
  }

  if (!TRANSICOES_VALIDAS[statusAtual].includes(statusNovo)) {
    throw new AppError(`Transição de status inválida: não é possível ir de "${statusAtual}" para "${statusNovo}".`, 400);
  }
}
