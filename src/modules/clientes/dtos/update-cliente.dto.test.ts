import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { assertValidUpdateClienteDto } from "./update-cliente.dto";

describe("assertValidUpdateClienteDto", () => {
  it("valida e normaliza só os campos enviados", () => {
    expect(assertValidUpdateClienteDto({ telefone: "(33) 3521-1234" })).toEqual({ telefone: "3335211234" });
    expect(assertValidUpdateClienteDto({ nome: " João " })).toEqual({ nome: "João" });
  });

  it("observacoes: null limpa o campo e ausente não altera", () => {
    expect(assertValidUpdateClienteDto({ observacoes: null })).toEqual({ observacoes: null });
    expect(assertValidUpdateClienteDto({ nome: "João" })).not.toHaveProperty("observacoes");
  });

  it.each([
    ["corpo vazio", {}],
    ["sem corpo", undefined],
    ["só campos desconhecidos", { tenant_id: "x", ativo: false }],
    ["telefone inválido", { telefone: "999" }],
    ["nome em branco", { nome: "" }],
  ])("rejeita %s", (_caso, body) => {
    expect(() => assertValidUpdateClienteDto(body)).toThrow(AppError);
  });
});
