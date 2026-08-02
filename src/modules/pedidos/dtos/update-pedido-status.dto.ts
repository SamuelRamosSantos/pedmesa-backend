import { AppError } from "../../../shared/errors/app-error";
import { StatusPreparo } from "../entities/pedido.entity";

const STATUS_PERMITIDOS_PARA_ATUALIZACAO: StatusPreparo[] = [
  StatusPreparo.EM_PREPARO,
  StatusPreparo.PRONTO,
  StatusPreparo.ENTREGUE,
];

export interface UpdatePedidoStatusDto {
  statusPreparo: StatusPreparo;
}

export function assertValidUpdatePedidoStatusDto(body: unknown): UpdatePedidoStatusDto {
  const { status_preparo: statusPreparo } = (body ?? {}) as Record<string, unknown>;

  if (
    typeof statusPreparo !== "string" ||
    !STATUS_PERMITIDOS_PARA_ATUALIZACAO.includes(statusPreparo as StatusPreparo)
  ) {
    throw new AppError(
      `status_preparo deve ser um dos seguintes: ${STATUS_PERMITIDOS_PARA_ATUALIZACAO.join(", ")}.`,
      400
    );
  }

  return { statusPreparo: statusPreparo as StatusPreparo };
}
