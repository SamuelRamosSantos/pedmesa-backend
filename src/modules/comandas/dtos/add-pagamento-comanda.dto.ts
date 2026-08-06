import { AppError } from "../../../shared/errors/app-error";
import { FormaPagamento } from "../entities/pagamento-comanda.entity";

const FORMAS_PAGAMENTO_VALIDAS: readonly FormaPagamento[] = [
  FormaPagamento.PIX,
  FormaPagamento.DINHEIRO,
  FormaPagamento.CARTAO_CREDITO,
  FormaPagamento.CARTAO_DEBITO,
];

export interface AddPagamentoComandaDto {
  forma: FormaPagamento;
  valor: number;
}

export function assertValidAddPagamentoComandaDto(body: unknown): AddPagamentoComandaDto {
  const { forma, valor } = (body ?? {}) as Record<string, unknown>;

  if (typeof forma !== "string" || !FORMAS_PAGAMENTO_VALIDAS.includes(forma as FormaPagamento)) {
    throw new AppError(`forma deve ser um dos seguintes: ${FORMAS_PAGAMENTO_VALIDAS.join(", ")}.`, 400);
  }

  if (typeof valor !== "number" || !Number.isFinite(valor) || valor <= 0) {
    throw new AppError("valor deve ser um número maior que zero.", 400);
  }

  return { forma: forma as FormaPagamento, valor };
}
