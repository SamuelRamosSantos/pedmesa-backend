import { AppError } from "../../../shared/errors/app-error";
import { isUuid } from "../../../shared/utils/is-uuid";

export interface CreatePedidoItemInput {
  produtoId: string;
  integranteId: string | null;
  quantidade: number;
  observacao: string | null;
}

export interface CreatePedidoDto {
  itens: CreatePedidoItemInput[];
}

function assertValidItem(item: unknown, index: number): CreatePedidoItemInput {
  const {
    produto_id: produtoId,
    integrante_id: integranteId,
    quantidade,
    observacao,
  } = (item ?? {}) as Record<string, unknown>;

  if (!isUuid(produtoId)) {
    throw new AppError(`O item na posição ${index} possui um produto_id inválido.`, 400);
  }

  if (integranteId !== undefined && integranteId !== null && !isUuid(integranteId)) {
    throw new AppError(`O item na posição ${index} possui um integrante_id inválido.`, 400);
  }

  if (typeof quantidade !== "number" || !Number.isInteger(quantidade) || quantidade <= 0) {
    throw new AppError(`O item na posição ${index} deve ter uma quantidade inteira maior que zero.`, 400);
  }

  if (observacao !== undefined && observacao !== null && typeof observacao !== "string") {
    throw new AppError(`O item na posição ${index} possui uma observação inválida.`, 400);
  }

  return {
    produtoId,
    integranteId: typeof integranteId === "string" ? integranteId : null,
    quantidade,
    observacao: typeof observacao === "string" ? observacao : null,
  };
}

export function assertValidCreatePedidoDto(body: unknown): CreatePedidoDto {
  const { itens } = (body ?? {}) as Record<string, unknown>;

  if (!Array.isArray(itens) || itens.length === 0) {
    throw new AppError("É necessário informar ao menos um item no pedido.", 400);
  }

  return { itens: itens.map(assertValidItem) };
}
