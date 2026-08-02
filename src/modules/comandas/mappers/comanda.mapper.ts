import { Comanda, ComandaStatus } from "../entities/comanda.entity";
import { IntegranteResponse, toIntegranteResponse } from "./integrante.mapper";

export interface ComandaDetailResponse {
  id: string;
  numero_comanda: number;
  status: ComandaStatus;
  aberta_em: Date;
  integrantes: IntegranteResponse[];
}

export interface ComandaListItemResponse {
  id: string;
  numero_comanda: number;
  status: ComandaStatus;
  total_integrantes: number;
  aberta_em: Date;
}

export function toComandaDetailResponse(comanda: Comanda): ComandaDetailResponse {
  return {
    id: comanda.id,
    numero_comanda: comanda.numeroComanda,
    status: comanda.status,
    aberta_em: comanda.abertaEm,
    integrantes: (comanda.integrantes ?? []).map(toIntegranteResponse),
  };
}

export function toComandaListItemResponse(comanda: Comanda): ComandaListItemResponse {
  return {
    id: comanda.id,
    numero_comanda: comanda.numeroComanda,
    status: comanda.status,
    total_integrantes: comanda.integrantes?.length ?? 0,
    aberta_em: comanda.abertaEm,
  };
}

export interface JuntarComandasResponse {
  mensagem: string;
  comanda_principal_id: string;
}

export function toJuntarComandasResponse(comandaPrincipal: Comanda): JuntarComandasResponse {
  return {
    mensagem: "Comandas juntadas com sucesso.",
    comanda_principal_id: comandaPrincipal.id,
  };
}

export interface FecharComandaResponse {
  status: ComandaStatus;
  mensagem: string;
}

export function toFecharComandaResponse(comanda: Comanda): FecharComandaResponse {
  return {
    status: comanda.status,
    mensagem: "Comanda quitada com sucesso e liberada para o salão.",
  };
}
