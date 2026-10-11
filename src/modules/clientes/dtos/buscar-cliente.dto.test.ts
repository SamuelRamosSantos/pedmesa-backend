import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { assertValidBuscarClienteQuery } from "./buscar-cliente.dto";

describe("assertValidBuscarClienteQuery", () => {
  it("normaliza o telefone digitado no formulário", () => {
    expect(assertValidBuscarClienteQuery({ telefone: "(11) 98765-4321" })).toEqual({ telefone: "11987654321" });
  });

  it.each([
    ["sem telefone", {}],
    ["telefone incompleto", { telefone: "98765" }],
    ["telefone repetido na query (array)", { telefone: ["11987654321", "11912345678"] }],
  ])("rejeita %s", (_caso, query) => {
    expect(() => assertValidBuscarClienteQuery(query)).toThrow(AppError);
  });
});
