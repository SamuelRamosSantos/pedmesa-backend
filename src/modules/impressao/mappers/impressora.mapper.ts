import { Impressora } from "../entities/impressora.entity";

export interface ImpressoraResponse {
  id: string;
  nome: string;
  ip: string;
  porta: number;
  ativo: boolean;
  criado_em: Date;
}

export function toImpressoraResponse(impressora: Impressora): ImpressoraResponse {
  return {
    id: impressora.id,
    nome: impressora.nome,
    ip: impressora.ip,
    porta: impressora.porta,
    ativo: impressora.ativo,
    criado_em: impressora.criadoEm,
  };
}
