import { AppError } from "../../../shared/errors/app-error";
import { StatusEntrega } from "../entities/entrega.entity";

const STATUS_VALIDOS = Object.values(StatusEntrega);

export interface ListarEntregasFiltros {
  status: StatusEntrega | null;
}

export function assertValidListarEntregasQuery(query: unknown): ListarEntregasFiltros {
  const { status } = (query ?? {}) as Record<string, unknown>;

  if (status === undefined || status === "") {
    return { status: null };
  }

  if (typeof status !== "string" || !STATUS_VALIDOS.includes(status as StatusEntrega)) {
    throw new AppError(`status deve ser um dos seguintes: ${STATUS_VALIDOS.join(", ")}.`, 400);
  }

  return { status: status as StatusEntrega };
}
