import { FilaImpressao, StatusFilaImpressao, TipoFilaImpressao } from "../entities/fila-impressao.entity";
import { PrintJobItemPayload } from "../types/print-job.types";

export interface FilaImpressaoResponse {
  id: string;
  tipo: TipoFilaImpressao;
  pedido_id: string | null;
  numero_comanda: number;
  valor_total: number | null;
  status: StatusFilaImpressao;
  tentativas: number;
  itens: PrintJobItemPayload[];
  criado_em: Date;
}

export function toFilaImpressaoResponse(job: FilaImpressao): FilaImpressaoResponse {
  return {
    id: job.id,
    tipo: job.tipo,
    pedido_id: job.pedidoId,
    numero_comanda: job.numeroComanda,
    valor_total: job.valorTotal,
    status: job.status,
    tentativas: job.tentativas,
    itens: job.payload,
    criado_em: job.criadoEm,
  };
}
