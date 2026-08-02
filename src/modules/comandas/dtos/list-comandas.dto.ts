import { AppError } from "../../../shared/errors/app-error";
import { ComandaStatus } from "../entities/comanda.entity";

export interface ListComandasFilters {
  status: ComandaStatus;
}

export function parseListComandasFilters(query: Record<string, unknown>): ListComandasFilters {
  const { status } = query;

  if (status === undefined) {
    return { status: ComandaStatus.ABERTA };
  }

  if (status !== ComandaStatus.ABERTA && status !== ComandaStatus.FECHADA) {
    throw new AppError("O parâmetro status deve ser 'aberta' ou 'fechada'.", 400);
  }

  return { status };
}
