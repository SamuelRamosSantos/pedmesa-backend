import { AppError } from "../../../shared/errors/app-error";
import { isUuid } from "../../../shared/utils/is-uuid";

export interface ListProductsFilters {
  categoriaId?: string;
  disponivel?: boolean;
}

export function parseListProductsFilters(query: Record<string, unknown>): ListProductsFilters {
  const filters: ListProductsFilters = {};

  if (query.categoria_id !== undefined) {
    if (!isUuid(query.categoria_id)) {
      throw new AppError("categoria_id inválido.", 400);
    }
    filters.categoriaId = query.categoria_id;
  }

  if (query.disponivel !== undefined) {
    if (query.disponivel === "true") {
      filters.disponivel = true;
    } else if (query.disponivel === "false") {
      filters.disponivel = false;
    } else {
      throw new AppError("O parâmetro disponivel deve ser 'true' ou 'false'.", 400);
    }
  }

  return filters;
}
