import { assertValidIp, assertValidNome, assertValidPorta } from "./impressora-input.validator";

const PORTA_PADRAO = 9100;

export interface CreateImpressoraDto {
  nome: string;
  ip: string;
  porta: number;
}

export function assertValidCreateImpressoraDto(body: unknown): CreateImpressoraDto {
  const { nome, ip, porta } = (body ?? {}) as Record<string, unknown>;

  return {
    nome: assertValidNome(nome),
    ip: assertValidIp(ip),
    porta: porta === undefined ? PORTA_PADRAO : assertValidPorta(porta),
  };
}
