import { TipoAtendimento } from "../../comandas/entities/comanda.entity";
import { FormaPagamento } from "../../comandas/entities/pagamento-comanda.entity";
import { PeriodoDashboard } from "../dtos/dashboard-filtro.dto";
import { HistoricoComandaLinha, ProdutoMaisPedido, ResumoDashboard } from "../services/dashboard.service";

export interface ProdutoMaisPedidoResponse {
  produto_nome: string;
  quantidade: number;
}

export interface HistoricoComandaResponse {
  comanda_id: string;
  fechada_em: Date;
  tipo_atendimento: TipoAtendimento;
  identificador: string;
  valor: number;
  formas_pagamento: FormaPagamento[];
}

export interface DashboardResponse {
  periodo: PeriodoDashboard;
  faturamento: number;
  taxas_entrega: number;
  comandas_fechadas: number;
  ticket_medio: number;
  produtos_mais_pedidos: ProdutoMaisPedidoResponse[];
  historico_comandas: HistoricoComandaResponse[];
}

export function toDashboardResponse(
  periodo: PeriodoDashboard,
  resumo: ResumoDashboard,
  produtos: ProdutoMaisPedido[],
  historico: HistoricoComandaLinha[]
): DashboardResponse {
  return {
    periodo,
    faturamento: resumo.faturamento,
    taxas_entrega: resumo.taxasEntrega,
    comandas_fechadas: resumo.comandasFechadas,
    ticket_medio: resumo.ticketMedio,
    produtos_mais_pedidos: produtos.map((produto) => ({
      produto_nome: produto.produtoNome,
      quantidade: produto.quantidade,
    })),
    historico_comandas: historico.map((linha) => ({
      comanda_id: linha.comandaId,
      fechada_em: linha.fechadaEm,
      tipo_atendimento: linha.tipoAtendimento,
      identificador: linha.identificador,
      valor: linha.valor,
      formas_pagamento: linha.formasPagamento,
    })),
  };
}
