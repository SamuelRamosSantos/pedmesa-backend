import { Comanda, ComandaStatus } from "../entities/comanda.entity";
import { ExtratoCalculado } from "../services/extrato-calculator";

export interface ExtratoResponse extends ExtratoCalculado {
  comanda_id: string;
  numero_comanda: number;
  status: ComandaStatus;
}

export function toExtratoResponse(comanda: Comanda, calculado: ExtratoCalculado): ExtratoResponse {
  return {
    comanda_id: comanda.id,
    numero_comanda: comanda.numeroComanda,
    status: comanda.status,
    ...calculado,
  };
}
