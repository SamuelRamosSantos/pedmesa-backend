import { AppError } from "../../../shared/errors/app-error";
import {
  validarAtivoTaxa,
  validarBairroTaxa,
  validarCidadeTaxa,
  validarTempoEstimadoMin,
  validarValorTaxa,
} from "./taxa-entrega-input.validator";

export interface UpdateTaxaEntregaDto {
  cidade?: string;
  bairro?: string;
  valor?: number;
  tempoEstimadoMin?: number | null;
  ativo?: boolean;
}

// Atualização parcial. tempo_estimado_min: null remove a estimativa; ausente mantém.
export function assertValidUpdateTaxaEntregaDto(body: unknown): UpdateTaxaEntregaDto {
  const campos = (body ?? {}) as Record<string, unknown>;
  const dto: UpdateTaxaEntregaDto = {};

  if (campos.cidade !== undefined) dto.cidade = validarCidadeTaxa(campos.cidade);
  if (campos.bairro !== undefined) dto.bairro = validarBairroTaxa(campos.bairro);
  if (campos.valor !== undefined) dto.valor = validarValorTaxa(campos.valor);
  if ("tempo_estimado_min" in campos) dto.tempoEstimadoMin = validarTempoEstimadoMin(campos.tempo_estimado_min);
  if (campos.ativo !== undefined) dto.ativo = validarAtivoTaxa(campos.ativo);

  if (Object.keys(dto).length === 0) {
    throw new AppError("Informe ao menos um campo para atualizar: cidade, bairro, valor, tempo_estimado_min ou ativo.", 400);
  }

  return dto;
}
