import { toCents } from "../../../shared/utils/money";

// Cobre o "resto" que sobra ao dividir a cota compartilhada entre integrantes
// (ex.: 10.00 / 3 = 3.33 cada, faltando 1 centavo para fechar o valor exato).
const TOLERANCIA_CENTS = 1;

export interface PagamentoInput {
  valor: number;
}

export interface AvaliacaoFechamento {
  totalComandaCents: number;
  totalPagoCents: number;
  saldoCents: number;
  suficiente: boolean;
}

export function avaliarFechamento(valorTotalComanda: number, pagamentos: PagamentoInput[]): AvaliacaoFechamento {
  const totalComandaCents = toCents(valorTotalComanda);
  const totalPagoCents = pagamentos.reduce((soma, pagamento) => soma + toCents(pagamento.valor), 0);

  return {
    totalComandaCents,
    totalPagoCents,
    saldoCents: totalPagoCents - totalComandaCents,
    suficiente: totalPagoCents + TOLERANCIA_CENTS >= totalComandaCents,
  };
}

export function podeCancelarComandaZerada(valorTotalComanda: number): boolean {
  return toCents(valorTotalComanda) === 0;
}
