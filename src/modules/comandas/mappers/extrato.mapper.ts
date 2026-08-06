import { Comanda, ComandaStatus, DescontoTipo } from "../entities/comanda.entity";
import { PagamentoComanda } from "../entities/pagamento-comanda.entity";
import { ExtratoCalculado } from "../services/extrato-calculator";
import { PagamentoComandaResponse, toPagamentoComandaResponse } from "./pagamento-comanda.mapper";

export interface ExtratoResponse extends ExtratoCalculado {
  comanda_id: string;
  numero_comanda: number;
  status: ComandaStatus;
  desconto_tipo: DescontoTipo;
  desconto_valor: number;
  subtotal: number | null;
  total_final: number | null;
  pagamentos: PagamentoComandaResponse[];
}

export function toExtratoResponse(
  comanda: Comanda,
  calculado: ExtratoCalculado,
  pagamentos: PagamentoComanda[]
): ExtratoResponse {
  return {
    comanda_id: comanda.id,
    numero_comanda: comanda.numeroComanda,
    status: comanda.status,
    desconto_tipo: comanda.descontoTipo,
    desconto_valor: comanda.descontoValor,
    subtotal: comanda.subtotal,
    total_final: comanda.totalFinal,
    pagamentos: pagamentos.map(toPagamentoComandaResponse),
    ...calculado,
  };
}
