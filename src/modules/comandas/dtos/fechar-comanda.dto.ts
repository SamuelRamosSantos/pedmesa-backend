import { AppError } from "../../../shared/errors/app-error";

export type FormaPagamento = "pix" | "dinheiro" | "cartao_credito" | "cartao_debito";

const FORMAS_PAGAMENTO_VALIDAS: readonly FormaPagamento[] = ["pix", "dinheiro", "cartao_credito", "cartao_debito"];

export interface PagamentoDto {
  forma: FormaPagamento;
  valor: number;
}

export interface FecharComandaDto {
  pagamentos: PagamentoDto[];
}

function assertValidPagamento(item: unknown, index: number): PagamentoDto {
  const { forma, valor } = (item ?? {}) as Record<string, unknown>;

  if (typeof forma !== "string" || !FORMAS_PAGAMENTO_VALIDAS.includes(forma as FormaPagamento)) {
    throw new AppError(
      `O pagamento na posição ${index} possui uma forma inválida. Use: ${FORMAS_PAGAMENTO_VALIDAS.join(", ")}.`,
      400
    );
  }

  if (typeof valor !== "number" || !Number.isFinite(valor) || valor <= 0) {
    throw new AppError(`O pagamento na posição ${index} deve ter um valor numérico maior que zero.`, 400);
  }

  return { forma: forma as FormaPagamento, valor };
}

export function assertValidFecharComandaDto(body: unknown): FecharComandaDto {
  const { pagamentos } = (body ?? {}) as Record<string, unknown>;

  if (!Array.isArray(pagamentos) || pagamentos.length === 0) {
    throw new AppError("É necessário informar ao menos uma forma de pagamento.", 400);
  }

  return { pagamentos: pagamentos.map(assertValidPagamento) };
}
