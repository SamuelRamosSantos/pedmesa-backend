import { Category } from "../entities/category.entity";

export interface CategoryResponse {
  id: string;
  nome: string;
  ordem_exibicao: number;
  ativo: boolean;
}

export function toCategoryResponse(category: Category): CategoryResponse {
  return {
    id: category.id,
    nome: category.nome,
    ordem_exibicao: category.ordemExibicao,
    ativo: category.ativo,
  };
}
