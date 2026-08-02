import { AppError } from "../../../shared/errors/app-error";
import { StatusPreparo } from "../entities/pedido.entity";

const STATUS_VALIDOS: StatusPreparo[] = [
  StatusPreparo.PENDENTE,
  StatusPreparo.EM_PREPARO,
  StatusPreparo.PRONTO,
  StatusPreparo.ENTREGUE,
];

export interface ListPedidosFilters {
  status?: StatusPreparo;
}

export function parseListPedidosFilters(query: Record<string, unknown>): ListPedidosFilters {
  const { status } = query;

  if (status === undefined) {
    return {};
  }

  if (typeof status !== "string" || !STATUS_VALIDOS.includes(status as StatusPreparo)) {
    throw new AppError(`O parâmetro status deve ser um dos seguintes: ${STATUS_VALIDOS.join(", ")}.`, 400);
  }

  return { status: status as StatusPreparo };
}
