import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { assertValidCreateImpressoraDto } from "./create-impressora.dto";

describe("assertValidCreateImpressoraDto", () => {
  it("aceita uma impressora válida com porta padrão quando omitida", () => {
    const dto = assertValidCreateImpressoraDto({ nome: "Cozinha", ip: "192.168.0.100" });

    expect(dto).toEqual({ nome: "Cozinha", ip: "192.168.0.100", porta: 9100 });
  });

  it("aceita uma porta customizada", () => {
    const dto = assertValidCreateImpressoraDto({ nome: "Bar", ip: "10.0.0.5", porta: 9200 });

    expect(dto.porta).toBe(9200);
  });

  it("rejeita nome vazio", () => {
    expect(() => assertValidCreateImpressoraDto({ nome: "  ", ip: "10.0.0.5" })).toThrow(AppError);
  });

  it("rejeita nome ausente", () => {
    expect(() => assertValidCreateImpressoraDto({ ip: "10.0.0.5" })).toThrow(AppError);
  });

  it("rejeita IP inválido", () => {
    expect(() => assertValidCreateImpressoraDto({ nome: "Cozinha", ip: "999.0.0.1" })).toThrow(AppError);
    expect(() => assertValidCreateImpressoraDto({ nome: "Cozinha", ip: "não-é-ip" })).toThrow(AppError);
    expect(() => assertValidCreateImpressoraDto({ nome: "Cozinha", ip: "192.168.0" })).toThrow(AppError);
  });

  it("rejeita porta fora do intervalo válido", () => {
    expect(() => assertValidCreateImpressoraDto({ nome: "Cozinha", ip: "10.0.0.5", porta: 0 })).toThrow(AppError);
    expect(() => assertValidCreateImpressoraDto({ nome: "Cozinha", ip: "10.0.0.5", porta: 70000 })).toThrow(
      AppError
    );
    expect(() => assertValidCreateImpressoraDto({ nome: "Cozinha", ip: "10.0.0.5", porta: 1.5 })).toThrow(AppError);
  });
});
