import { Comanda, ComandaStatus, DescontoTipo } from "../entities/comanda.entity";
import { FechamentoResultado } from "../services/comanda.service";
import { RateioIntegranteComDesconto } from "../services/desconto-calculator";
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
  subtotal: number;
  desconto_tipo: DescontoTipo;
  desconto_valor: number;
  desconto_aplicado: number;
  total_final: number;
  divisao_por_integrante: RateioIntegranteComDesconto[];
}

export function toFecharComandaResponse(resultado: FechamentoResultado): FecharComandaResponse {
  return {
    status: resultado.comanda.status,
    mensagem: "Comanda quitada com sucesso e liberada para o salão.",
    subtotal: resultado.subtotal,
    desconto_tipo: resultado.descontoTipo,
    desconto_valor: resultado.descontoValor,
    desconto_aplicado: resultado.descontoAplicado,
    total_final: resultado.totalFinal,
    divisao_por_integrante: resultado.divisaoPorIntegrante,
  };
}

export interface DescontoComandaResponse {
  desconto_tipo: DescontoTipo;
  desconto_valor: number;
}

export function toDescontoComandaResponse(comanda: Comanda): DescontoComandaResponse {
  return {
    desconto_tipo: comanda.descontoTipo,
    desconto_valor: comanda.descontoValor,
  };
}

export interface CancelarComandaResponse {
  status: ComandaStatus;
  mensagem: string;
}

export function toCancelarComandaResponse(comanda: Comanda): CancelarComandaResponse {
  return {
    status: comanda.status,
    mensagem: "Comanda cancelada e mesa liberada com sucesso.",
  };
}
