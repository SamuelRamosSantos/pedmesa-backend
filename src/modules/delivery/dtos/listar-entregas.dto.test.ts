import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { StatusEntrega } from "../entities/entrega.entity";
import { assertValidListarEntregasQuery } from "./listar-entregas.dto";

describe("assertValidListarEntregasQuery", () => {
  it("sem filtro devolve status null", () => {
    expect(assertValidListarEntregasQuery({})).toEqual({ status: null });
    expect(assertValidListarEntregasQuery({ status: "" })).toEqual({ status: null });
  });

  it("aceita um status válido", () => {
    expect(assertValidListarEntregasQuery({ status: "em_rota" })).toEqual({ status: StatusEntrega.EM_ROTA });
  });

  it.each([["inexistente", { status: "saiu" }], ["repetido na query", { status: ["em_rota", "entregue"] }]])("rejeita status %s", (_caso, query) => {
    expect(() => assertValidListarEntregasQuery(query)).toThrow(AppError);
  });
});
