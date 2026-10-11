import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { assertValidUpdateEnderecoClienteDto } from "./update-endereco-cliente.dto";

describe("assertValidUpdateEnderecoClienteDto", () => {
  it("valida e normaliza só os campos enviados", () => {
    expect(assertValidUpdateEnderecoClienteDto({ cep: "04101-000", uf: "sp" })).toEqual({ cep: "04101000", uf: "SP" });
    expect(assertValidUpdateEnderecoClienteDto({ numero: " 15 " })).toEqual({ numero: "15" });
  });

  it("complemento/referencia: null limpa e ausente não altera", () => {
    expect(assertValidUpdateEnderecoClienteDto({ complemento: null })).toEqual({ complemento: null });
    expect(assertValidUpdateEnderecoClienteDto({ referencia: "   " })).toEqual({ referencia: null });
    expect(assertValidUpdateEnderecoClienteDto({ numero: "1" })).not.toHaveProperty("complemento");
  });

  it("aceita principal: true", () => {
    expect(assertValidUpdateEnderecoClienteDto({ principal: true })).toEqual({ principal: true });
  });

  it("recusa principal: false com orientação", () => {
    expect(() => assertValidUpdateEnderecoClienteDto({ principal: false })).toThrow(
      "Para trocar o endereço principal, marque outro endereço como principal."
    );
  });

  it.each([
    ["corpo vazio", {}],
    ["sem corpo", undefined],
    ["só campos desconhecidos", { tenant_id: "x", cliente_id: "y" }],
    ["cep inválido", { cep: "123" }],
    ["uf inválida", { uf: "XX" }],
    ["logradouro em branco", { logradouro: " " }],
    ["principal como texto", { principal: "true" }],
  ])("rejeita %s", (_caso, body) => {
    expect(() => assertValidUpdateEnderecoClienteDto(body)).toThrow(AppError);
  });
});
