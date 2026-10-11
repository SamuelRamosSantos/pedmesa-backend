import { AppError } from "../../../shared/errors/app-error";
import { ComandaStatus, TipoAtendimento } from "../entities/comanda.entity";

export interface ListComandasFilters {
  status: ComandaStatus;
  tipoAtendimento: TipoAtendimento;
}

function parseStatus(status: unknown): ComandaStatus {
  if (status === undefined) {
    return ComandaStatus.ABERTA;
  }

  if (status !== ComandaStatus.ABERTA && status !== ComandaStatus.FECHADA) {
    throw new AppError("O parâmetro status deve ser 'aberta' ou 'fechada'.", 400);
  }

  return status;
}

// Padrão "mesa" (PED-103): mapa de mesas e tela do garçom nunca recebem comanda delivery.
function parseTipoAtendimento(tipo: unknown): TipoAtendimento {
  if (tipo === undefined) {
    return TipoAtendimento.MESA;
  }

  if (tipo !== TipoAtendimento.MESA && tipo !== TipoAtendimento.DELIVERY) {
    throw new AppError("O parâmetro tipo deve ser 'mesa' ou 'delivery'.", 400);
  }

  return tipo;
}

export function parseListComandasFilters(query: Record<string, unknown>): ListComandasFilters {
  return {
    status: parseStatus(query.status),
    tipoAtendimento: parseTipoAtendimento(query.tipo),
  };
}
