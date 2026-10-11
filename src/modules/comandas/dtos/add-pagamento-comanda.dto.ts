import { AppError } from "../../../shared/errors/app-error";
import { FormaPagamento } from "../entities/pagamento-comanda.entity";
import { validarFormaPagamento } from "./forma-pagamento.validator";

export interface AddPagamentoComandaDto {
  forma: FormaPagamento;
  valor: number;
}

export function assertValidAddPagamentoComandaDto(body: unknown): AddPagamentoComandaDto {
  const { forma, valor } = (body ?? {}) as Record<string, unknown>;

  const formaValidada = validarFormaPagamento(forma, "forma");

  if (typeof valor !== "number" || !Number.isFinite(valor) || valor <= 0) {
    throw new AppError("valor deve ser um número maior que zero.", 400);
  }

  return { forma: formaValidada, valor };
}
