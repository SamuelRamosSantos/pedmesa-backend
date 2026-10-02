import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { assertValidCreateClienteDto } from "./create-cliente.dto";

const VALID_BODY = {
  nome: "  Maria da Silva  ",
  telefone: "+55 (11) 98765-4321",
  observacoes: "  Portão azul  ",
};

describe("assertValidCreateClienteDto", () => {
  it("aceita um corpo válido e grava o telefone normalizado", () => {
    expect(assertValidCreateClienteDto(VALID_BODY)).toEqual({
      nome: "Maria da Silva",
      telefone: "11987654321",
      observacoes: "Portão azul",
    });
  });

  it("observacoes ausente, null ou em branco vira null", () => {
    expect(assertValidCreateClienteDto({ ...VALID_BODY, observacoes: undefined }).observacoes).toBeNull();
    expect(assertValidCreateClienteDto({ ...VALID_BODY, observacoes: null }).observacoes).toBeNull();
    expect(assertValidCreateClienteDto({ ...VALID_BODY, observacoes: "   " }).observacoes).toBeNull();
  });

  it("ignora campos não declarados, como tenant_id vindo do cliente", () => {
    const dto = assertValidCreateClienteDto({ ...VALID_BODY, tenant_id: "outro-tenant" });
    expect(dto).not.toHaveProperty("tenant_id");
    expect(dto).not.toHaveProperty("tenantId");
  });

  it.each([
    ["nome ausente", { ...VALID_BODY, nome: undefined }],
    ["nome em branco", { ...VALID_BODY, nome: "   " }],
    ["nome longo demais", { ...VALID_BODY, nome: "a".repeat(121) }],
    ["telefone ausente", { ...VALID_BODY, telefone: undefined }],
    ["telefone inválido", { ...VALID_BODY, telefone: "1234" }],
    ["telefone que não é texto", { ...VALID_BODY, telefone: 11987654321 }],
    ["observacoes que não é texto", { ...VALID_BODY, observacoes: 42 }],
    ["observacoes longa demais", { ...VALID_BODY, observacoes: "a".repeat(501) }],
    ["corpo vazio", undefined],
  ])("rejeita %s", (_caso, body) => {
    expect(() => assertValidCreateClienteDto(body)).toThrow(AppError);
  });
});
