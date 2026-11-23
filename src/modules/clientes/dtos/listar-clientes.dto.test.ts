import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import {
  assertValidListarClientesQuery,
  CLIENTES_POR_PAGINA_PADRAO,
} from "./listar-clientes.dto";

describe("assertValidListarClientesQuery", () => {
  it("sem parâmetros: lista todos, primeira página, tamanho padrão", () => {
    expect(assertValidListarClientesQuery({})).toEqual({
      busca: null,
      pagina: 1,
      porPagina: CLIENTES_POR_PAGINA_PADRAO,
    });
  });

  it("apara a busca e trata só espaços como sem filtro", () => {
    expect(assertValidListarClientesQuery({ busca: "  Maria " }).busca).toBe(
      "Maria",
    );
    expect(assertValidListarClientesQuery({ busca: "   " }).busca).toBeNull();
  });

  it("aceita página e tamanho dentro dos limites", () => {
    expect(
      assertValidListarClientesQuery({ pagina: "3", por_pagina: "50" }),
    ).toMatchObject({ pagina: 3, porPagina: 50 });
  });

  it.each([
    ["busca repetida (lista)", { busca: ["a", "b"] }],
    ["busca longa demais", { busca: "a".repeat(121) }],
    ["página zero", { pagina: "0" }],
    ["página fracionada", { pagina: "1.5" }],
    ["página não numérica", { pagina: "abc" }],
    ["tamanho acima do máximo", { por_pagina: "51" }],
  ])("rejeita %s", (_caso, query) => {
    expect(() => assertValidListarClientesQuery(query)).toThrow(AppError);
  });
});
