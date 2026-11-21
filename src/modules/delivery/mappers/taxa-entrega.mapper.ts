import { TaxaEntrega } from "../entities/taxa-entrega.entity";

export interface TaxaEntregaResponse {
  id: string;
  cidade: string;
  bairro: string;
  valor: number;
  tempo_estimado_min: number | null;
  ativo: boolean;
}

export function toTaxaEntregaResponse(taxa: TaxaEntrega): TaxaEntregaResponse {
  return {
    id: taxa.id,
    cidade: taxa.cidade,
    bairro: taxa.bairro,
    valor: taxa.valor,
    tempo_estimado_min: taxa.tempoEstimadoMin,
    ativo: taxa.ativo,
  };
}
