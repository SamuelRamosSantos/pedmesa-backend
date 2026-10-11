import { AppError } from "../../../shared/errors/app-error";

export interface ProdutoDoItem {
  id: string;
  nome: string;
  preco: number;
  disponivel: boolean;
}

// Confere, item a item, se o produto existe no tenant e está disponível. Devolve o produto
// de cada item na mesma ordem. Usada no lançamento de itens (mesa e delivery) e na cotação
// do delivery, para as mesmas regras e mensagens valerem nos dois lugares.
export function resolverProdutosDosItens<P extends ProdutoDoItem>(
  itens: ReadonlyArray<{ produtoId: string }>,
  produtosPorId: ReadonlyMap<string, P>
): P[] {
  return itens.map((item, index) => {
    const produto = produtosPorId.get(item.produtoId);

    if (!produto) {
      throw new AppError(`O produto informado no item ${index} não foi encontrado.`, 400);
    }

    if (!produto.disponivel) {
      throw new AppError(`O produto "${produto.nome}" está indisponível no momento.`, 400);
    }

    return produto;
  });
}
