import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { assertValidUpdateImpressoraDto } from "./update-impressora.dto";

describe("assertValidUpdateImpressoraDto", () => {
  it("aceita update parcial só com nome", () => {
    expect(assertValidUpdateImpressoraDto({ nome: "Cozinha 2" })).toEqual({ nome: "Cozinha 2" });
  });

  it("aceita update parcial só com ativo", () => {
    expect(assertValidUpdateImpressoraDto({ ativo: false })).toEqual({ ativo: false });
  });

  it("aceita todos os campos de uma vez", () => {
    const dto = assertValidUpdateImpressoraDto({ nome: "Bar", ip: "10.0.0.9", porta: 9100, ativo: true });

    expect(dto).toEqual({ nome: "Bar", ip: "10.0.0.9", porta: 9100, ativo: true });
  });

  it("rejeita corpo vazio", () => {
    expect(() => assertValidUpdateImpressoraDto({})).toThrow(AppError);
  });

  it("rejeita IP inválido quando informado", () => {
    expect(() => assertValidUpdateImpressoraDto({ ip: "abc" })).toThrow(AppError);
  });

  it("rejeita ativo não booleano", () => {
    expect(() => assertValidUpdateImpressoraDto({ ativo: "sim" })).toThrow(AppError);
  });
});
