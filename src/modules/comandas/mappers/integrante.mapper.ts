import { IntegranteComanda } from "../entities/integrante-comanda.entity";

export interface IntegranteResponse {
  id: string;
  nome: string;
}

export function toIntegranteResponse(integrante: IntegranteComanda): IntegranteResponse {
  return {
    id: integrante.id,
    nome: integrante.nome,
  };
}
