import { AppError } from "../../../shared/errors/app-error";
import { assertValidIp, assertValidNome, assertValidPorta } from "./impressora-input.validator";

export interface UpdateImpressoraDto {
  nome?: string;
  ip?: string;
  porta?: number;
  ativo?: boolean;
}

export function assertValidUpdateImpressoraDto(body: unknown): UpdateImpressoraDto {
  const { nome, ip, porta, ativo } = (body ?? {}) as Record<string, unknown>;

  const dto: UpdateImpressoraDto = {};

  if (nome !== undefined) {
    dto.nome = assertValidNome(nome);
  }

  if (ip !== undefined) {
    dto.ip = assertValidIp(ip);
  }

  if (porta !== undefined) {
    dto.porta = assertValidPorta(porta);
  }

  if (ativo !== undefined) {
    if (typeof ativo !== "boolean") {
      throw new AppError("ativo deve ser booleano.", 400);
    }
    dto.ativo = ativo;
  }

  if (Object.keys(dto).length === 0) {
    throw new AppError("Informe ao menos um campo para atualizar.", 400);
  }

  return dto;
}
