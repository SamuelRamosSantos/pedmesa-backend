import { fromCents, toCents } from "../../../shared/utils/money";
import { calcularDesconto, DescontoInput, RateioIntegranteComDesconto } from "./desconto-calculator";

export interface TotalComEntregaCalculado {
  subtotal: number;
  desconto_aplicado: number;
  taxa_entrega: number;
  total_final: number;
}

// Total do fechamento (ADR-001, decisão 2 do PO): o desconto incide só sobre os itens e
// a taxa de entrega é somada depois, sem desconto.
//   total_final = itens − desconto + taxa
// Para mesa (taxa 0) o resultado é idêntico ao de calcularDesconto.
export function calcularTotalComEntrega(
  subtotalItens: number,
  desconto: DescontoInput,
  taxaEntrega: number
): TotalComEntregaCalculado {
  const taxaEntregaCents = toCents(taxaEntrega);

  if (taxaEntregaCents < 0) {
    throw new Error(`taxaEntrega não pode ser negativa (recebido: ${taxaEntrega}).`);
  }

  const descontoCalculado = calcularDesconto(subtotalItens, desconto);

  return {
    subtotal: descontoCalculado.subtotal,
    desconto_aplicado: descontoCalculado.desconto_aplicado,
    taxa_entrega: fromCents(taxaEntregaCents),
    total_final: fromCents(toCents(descontoCalculado.total_final) + taxaEntregaCents),
  };
}

// A taxa de entrega entra no rateio do último integrante (no delivery há um só: o
// cliente), mantendo a soma dos total_a_pagar igual ao total_final.
export function somarTaxaEntregaAoRateio(
  rateio: RateioIntegranteComDesconto[],
  taxaEntrega: number
): RateioIntegranteComDesconto[] {
  const taxaEntregaCents = toCents(taxaEntrega);

  if (taxaEntregaCents === 0 || rateio.length === 0) {
    return rateio;
  }

  const ultimoIndice = rateio.length - 1;

  return rateio.map((integrante, index) =>
    index !== ultimoIndice
      ? integrante
      : {
          ...integrante,
          total_original: fromCents(toCents(integrante.total_original) + taxaEntregaCents),
          total_a_pagar: fromCents(toCents(integrante.total_a_pagar) + taxaEntregaCents),
        }
  );
}
