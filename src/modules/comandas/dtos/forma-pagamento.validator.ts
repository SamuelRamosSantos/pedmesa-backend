import { AppError } from "../../../shared/errors/app-error";
import { FormaPagamento } from "../entities/pagamento-comanda.entity";

export const FORMAS_PAGAMENTO_VALIDAS: readonly FormaPagamento[] = [
  FormaPagamento.PIX,
  FormaPagamento.DINHEIRO,
  FormaPagamento.CARTAO_CREDITO,
  FormaPagamento.CARTAO_DEBITO,
];

export function validarFormaPagamento(valor: unknown, campo: string): FormaPagamento {
  if (typeof valor !== "string" || !FORMAS_PAGAMENTO_VALIDAS.includes(valor as FormaPagamento)) {
    throw new AppError(`${campo} deve ser um dos seguintes: ${FORMAS_PAGAMENTO_VALIDAS.join(", ")}.`, 400);
  }

  return valor as FormaPagamento;
}
