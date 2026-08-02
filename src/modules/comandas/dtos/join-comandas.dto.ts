import { AppError } from "../../../shared/errors/app-error";
import { isUuid } from "../../../shared/utils/is-uuid";

export interface JoinComandasDto {
  comandaPrincipalId: string;
  comandasSecundariasIds: string[];
}

function assertValidComandaSecundariaId(id: unknown, index: number): string {
  if (!isUuid(id)) {
    throw new AppError(`A comanda secundária na posição ${index} possui um ID inválido.`, 400);
  }

  return id;
}

export function assertValidJoinComandasDto(body: unknown): JoinComandasDto {
  const { comanda_principal_id: comandaPrincipalId, comandas_secundarias_ids: comandasSecundariasIds } =
    (body ?? {}) as Record<string, unknown>;

  if (!isUuid(comandaPrincipalId)) {
    throw new AppError("comanda_principal_id inválido.", 400);
  }

  if (!Array.isArray(comandasSecundariasIds) || comandasSecundariasIds.length === 0) {
    throw new AppError("É necessário informar ao menos uma comanda secundária.", 400);
  }

  const idsValidados = comandasSecundariasIds.map(assertValidComandaSecundariaId);
  const idsUnicos = [...new Set(idsValidados)];

  if (idsUnicos.includes(comandaPrincipalId)) {
    throw new AppError("A comanda principal não pode estar na lista de comandas secundárias.", 400);
  }

  return {
    comandaPrincipalId,
    comandasSecundariasIds: idsUnicos,
  };
}
