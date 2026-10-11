import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { resolverProdutosDosItens } from "./produtos-dos-itens";

const burger = { id: "p1", nome: "X-Burger", preco: 20, disponivel: true };
const esgotado = { id: "p2", nome: "Esgotado", preco: 10, disponivel: false };
const produtos = new Map([burger, esgotado].map((p) => [p.id, p]));

describe("resolverProdutosDosItens", () => {
  it("devolve o produto de cada item, na ordem dos itens", () => {
    expect(resolverProdutosDosItens([{ produtoId: "p1" }, { produtoId: "p1" }], produtos)).toEqual([burger, burger]);
  });

  it("recusa produto inexistente indicando a posição do item", () => {
    expect(() => resolverProdutosDosItens([{ produtoId: "p1" }, { produtoId: "x" }], produtos)).toThrow(
      "O produto informado no item 1 não foi encontrado."
    );
  });

  it("recusa produto indisponível pelo nome", () => {
    expect(() => resolverProdutosDosItens([{ produtoId: "p2" }], produtos)).toThrow(AppError);
    expect(() => resolverProdutosDosItens([{ produtoId: "p2" }], produtos)).toThrow(
      'O produto "Esgotado" está indisponível no momento.'
    );
  });
});
