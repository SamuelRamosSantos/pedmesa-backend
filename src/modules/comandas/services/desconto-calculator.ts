import { AppError } from "../../../shared/errors/app-error";
import { fromCents, toCents } from "../../../shared/utils/money";
import { DescontoTipo } from "../entities/comanda.entity";

export interface DescontoInput {
  tipo: DescontoTipo;
  valor: number;
}

export interface DescontoCalculado {
  subtotal: number;
  desconto_aplicado: number;
  total_final: number;
}

export function calcularDesconto(subtotal: number, desconto: DescontoInput): DescontoCalculado {
  const subtotalCents = toCents(subtotal);

  if (desconto.tipo === DescontoTipo.NENHUM) {
    return { subtotal: fromCents(subtotalCents), desconto_aplicado: 0, total_final: fromCents(subtotalCents) };
  }

  const descontoCents =
    desconto.tipo === DescontoTipo.PERCENTUAL
      ? Math.round((subtotalCents * desconto.valor) / 100)
      : toCents(desconto.valor);

  if (descontoCents > subtotalCents) {
    throw new AppError("O desconto informado é maior que o valor da comanda.", 400);
  }

  return {
    subtotal: fromCents(subtotalCents),
    desconto_aplicado: fromCents(descontoCents),
    total_final: fromCents(subtotalCents - descontoCents),
  };
}

export interface RateioIntegranteInput {
  integranteId: string;
  nome: string;
  totalAPagar: number;
}

export interface RateioIntegranteComDesconto {
  integrante_id: string;
  nome: string;
  total_original: number;
  desconto_aplicado: number;
  total_a_pagar: number;
}

// Rateia o desconto entre os integrantes proporcionalmente ao que cada um consumiu.
// O último integrante absorve o centavo de arredondamento que sobrar, garantindo que
// a soma dos totais individuais bata exatamente com o total_final da comanda.
export function ratearDescontoPorIntegrante(
  integrantes: RateioIntegranteInput[],
  descontoTotal: number
): RateioIntegranteComDesconto[] {
  const descontoTotalCents = toCents(descontoTotal);
  const somaTotalCents = integrantes.reduce((soma, integrante) => soma + toCents(integrante.totalAPagar), 0);

  if (descontoTotalCents === 0 || somaTotalCents === 0) {
    return integrantes.map((integrante) => ({
      integrante_id: integrante.integranteId,
      nome: integrante.nome,
      total_original: fromCents(toCents(integrante.totalAPagar)),
      desconto_aplicado: 0,
      total_a_pagar: fromCents(toCents(integrante.totalAPagar)),
    }));
  }

  let descontoDistribuidoCents = 0;

  return integrantes.map((integrante, index) => {
    const totalIntegranteCents = toCents(integrante.totalAPagar);
    const isUltimo = index === integrantes.length - 1;

    const descontoIntegranteCents = isUltimo
      ? descontoTotalCents - descontoDistribuidoCents
      : Math.round((totalIntegranteCents / somaTotalCents) * descontoTotalCents);

    descontoDistribuidoCents += descontoIntegranteCents;

    return {
      integrante_id: integrante.integranteId,
      nome: integrante.nome,
      total_original: fromCents(totalIntegranteCents),
      desconto_aplicado: fromCents(descontoIntegranteCents),
      total_a_pagar: fromCents(totalIntegranteCents - descontoIntegranteCents),
    };
  });
}
