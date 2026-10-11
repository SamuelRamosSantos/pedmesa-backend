import { FilaImpressao, StatusFilaImpressao, TipoFilaImpressao } from "../entities/fila-impressao.entity";
import { DadosEntregaTicket, PrintJobItemPayload } from "../types/print-job.types";

// Formato consumido pelo pedmesa-print-agent (GET /impressao/pendentes). Ao mudar este
// contrato, atualize o poller.js e os formatters do agente no mesmo commit.
export interface FilaImpressaoResponse {
  id: string;
  tipo: TipoFilaImpressao;
  pedido_id: string | null;
  numero_comanda: number | null;
  numero_entrega: number | null;
  valor_total: number | null;
  dados_entrega: DadosEntregaTicket | null;
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
    numero_entrega: job.numeroEntrega,
    valor_total: job.valorTotal,
    dados_entrega: job.dadosEntrega,
    status: job.status,
    tentativas: job.tentativas,
    itens: job.payload,
    criado_em: job.criadoEm,
  };
}
