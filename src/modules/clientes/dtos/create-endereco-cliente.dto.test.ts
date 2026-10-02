import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { assertValidCreateEnderecoClienteDto } from "./create-endereco-cliente.dto";

const VALID_BODY = {
  cep: "01310-100",
  logradouro: " Avenida Paulista ",
  numero: "1000",
  complemento: "  ",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  uf: "sp",
  referencia: "Em frente ao MASP",
};

describe("assertValidCreateEnderecoClienteDto", () => {
  it("aceita um corpo válido e normaliza cep, uf e textos", () => {
    expect(assertValidCreateEnderecoClienteDto(VALID_BODY)).toEqual({
      cep: "01310100",
      logradouro: "Avenida Paulista",
      numero: "1000",
      complemento: null,
      bairro: "Bela Vista",
      cidade: "São Paulo",
      uf: "SP",
      referencia: "Em frente ao MASP",
      principal: false,
    });
  });

  it("principal ausente vira false e aceita true", () => {
    expect(assertValidCreateEnderecoClienteDto(VALID_BODY).principal).toBe(false);
    expect(assertValidCreateEnderecoClienteDto({ ...VALID_BODY, principal: true }).principal).toBe(true);
  });

  it("ignora tenant_id e cliente_id vindos do corpo", () => {
    const dto = assertValidCreateEnderecoClienteDto({ ...VALID_BODY, tenant_id: "x", cliente_id: "y" });
    expect(dto).not.toHaveProperty("tenant_id");
    expect(dto).not.toHaveProperty("cliente_id");
  });

  it.each([
    ["cep com 7 dígitos", { cep: "1310-100" }],
    ["cep com letra", { cep: "01310-1O0" }],
    ["logradouro ausente", { logradouro: undefined }],
    ["numero em branco", { numero: " " }],
    ["bairro ausente", { bairro: undefined }],
    ["cidade longa demais", { cidade: "a".repeat(121) }],
    ["uf inexistente", { uf: "XX" }],
    ["uf por extenso", { uf: "São Paulo" }],
    ["principal como texto", { principal: "true" }],
    ["referencia que não é texto", { referencia: 10 }],
  ])("rejeita %s", (_caso, alteracao) => {
    expect(() => assertValidCreateEnderecoClienteDto({ ...VALID_BODY, ...alteracao })).toThrow(AppError);
  });
});
