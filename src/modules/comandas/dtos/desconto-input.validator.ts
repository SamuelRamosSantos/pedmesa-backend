import { AppError } from "../../../shared/errors/app-error";
import { DescontoTipo } from "../entities/comanda.entity";

const DESCONTO_TIPOS_VALIDOS: readonly DescontoTipo[] = [
  DescontoTipo.PERCENTUAL,
  DescontoTipo.VALOR_FIXO,
  DescontoTipo.NENHUM,
];

export interface DescontoInputDto {
  descontoTipo: DescontoTipo;
  descontoValor: number;
}

export function assertValidDescontoInput(body: unknown): DescontoInputDto {
  const { desconto_tipo: descontoTipo, desconto_valor: descontoValor } = (body ?? {}) as Record<string, unknown>;

  if (descontoTipo !== undefined && !DESCONTO_TIPOS_VALIDOS.includes(descontoTipo as DescontoTipo)) {
    throw new AppError(`desconto_tipo deve ser um dos seguintes: ${DESCONTO_TIPOS_VALIDOS.join(", ")}.`, 400);
  }

  const tipoResolvido = (descontoTipo as DescontoTipo | undefined) ?? DescontoTipo.NENHUM;

  if (descontoValor !== undefined && (typeof descontoValor !== "number" || !Number.isFinite(descontoValor) || descontoValor < 0)) {
    throw new AppError("desconto_valor deve ser um número maior ou igual a zero.", 400);
  }

  const valorResolvido = typeof descontoValor === "number" ? descontoValor : 0;

  if (tipoResolvido === DescontoTipo.PERCENTUAL && valorResolvido > 100) {
    throw new AppError("desconto_valor percentual não pode ser maior que 100.", 400);
  }

  if (tipoResolvido !== DescontoTipo.NENHUM && valorResolvido === 0) {
    throw new AppError("Informe um desconto_valor maior que zero para aplicar o desconto.", 400);
  }

  return {
    descontoTipo: tipoResolvido,
    descontoValor: valorResolvido,
  };
}
