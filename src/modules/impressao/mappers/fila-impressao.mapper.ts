import { FilaImpressao, StatusFilaImpressao } from "../entities/fila-impressao.entity";
import { PrintJobItemPayload } from "../types/print-job.types";

export interface FilaImpressaoResponse {
  id: string;
  pedido_id: string;
  numero_comanda: number;
  status: StatusFilaImpressao;
  tentativas: number;
  itens: PrintJobItemPayload[];
  criado_em: Date;
}

export function toFilaImpressaoResponse(job: FilaImpressao): FilaImpressaoResponse {
  return {
    id: job.id,
    pedido_id: job.pedidoId,
    numero_comanda: job.numeroComanda,
    status: job.status,
    tentativas: job.tentativas,
    itens: job.payload,
    criado_em: job.criadoEm,
  };
}
