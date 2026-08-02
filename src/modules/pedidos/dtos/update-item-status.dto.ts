import { AppError } from "../../../shared/errors/app-error";
import { StatusItem } from "../entities/item-pedido.entity";

const STATUS_VALIDOS: StatusItem[] = [
  StatusItem.PENDENTE,
  StatusItem.EM_PREPARO,
  StatusItem.PRONTO,
  StatusItem.ENTREGUE,
  StatusItem.CANCELADO,
];

export interface UpdateItemStatusDto {
  status: StatusItem;
}

export function assertValidUpdateItemStatusDto(body: unknown): UpdateItemStatusDto {
  const { status } = (body ?? {}) as Record<string, unknown>;

  if (typeof status !== "string" || !STATUS_VALIDOS.includes(status as StatusItem)) {
    throw new AppError(`status deve ser um dos seguintes: ${STATUS_VALIDOS.join(", ")}.`, 400);
  }

  return { status: status as StatusItem };
}
