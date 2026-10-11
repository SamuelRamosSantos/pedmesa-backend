import {
  validarAtivoTaxa,
  validarBairroTaxa,
  validarCidadeTaxa,
  validarTempoEstimadoMin,
  validarValorTaxa,
} from "./taxa-entrega-input.validator";

export interface CreateTaxaEntregaDto {
  cidade: string;
  bairro: string;
  valor: number;
  tempoEstimadoMin: number | null;
  ativo: boolean;
}

export function assertValidCreateTaxaEntregaDto(body: unknown): CreateTaxaEntregaDto {
  const { cidade, bairro, valor, tempo_estimado_min: tempoEstimadoMin, ativo } = (body ?? {}) as Record<string, unknown>;

  return {
    cidade: validarCidadeTaxa(cidade),
    bairro: validarBairroTaxa(bairro),
    valor: validarValorTaxa(valor),
    tempoEstimadoMin: tempoEstimadoMin === undefined ? null : validarTempoEstimadoMin(tempoEstimadoMin),
    ativo: ativo === undefined ? true : validarAtivoTaxa(ativo),
  };
}
