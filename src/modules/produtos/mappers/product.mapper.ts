import { Product } from "../entities/product.entity";

export interface ProductResponse {
  id: string;
  categoria_id: string;
  nome: string;
  preco: number;
  descricao: string | null;
  disponivel: boolean;
  precisa_preparo: boolean;
}

export function toProductResponse(product: Product): ProductResponse {
  return {
    id: product.id,
    categoria_id: product.categoriaId,
    nome: product.nome,
    preco: product.preco,
    descricao: product.descricao,
    disponivel: product.disponivel,
    precisa_preparo: product.precisaPreparo,
  };
}
