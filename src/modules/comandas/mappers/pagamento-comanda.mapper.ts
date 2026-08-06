import { FormaPagamento, PagamentoComanda } from "../entities/pagamento-comanda.entity";

export interface PagamentoComandaResponse {
  id: string;
  forma: FormaPagamento;
  valor: number;
  criado_em: Date;
}

export function toPagamentoComandaResponse(pagamento: PagamentoComanda): PagamentoComandaResponse {
  return {
    id: pagamento.id,
    forma: pagamento.forma,
    valor: pagamento.valor,
    criado_em: pagamento.criadoEm,
  };
}
