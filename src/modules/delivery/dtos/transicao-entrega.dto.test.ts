import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { StatusEntrega } from "../entities/entrega.entity";
import { assertValidTransicaoEntregaDto } from "./transicao-entrega.dto";

describe("assertValidTransicaoEntregaDto", () => {
  it("aceita status, versão e motivo (aparado)", () => {
    expect(assertValidTransicaoEntregaDto({ status: "cancelado", versao: 3, motivo: "  Cliente desistiu  " })).toEqual({
      status: StatusEntrega.CANCELADO,
      versao: 3,
      motivo: "Cliente desistiu",
    });
  });

  it("motivo ausente ou em branco vira null", () => {
    expect(assertValidTransicaoEntregaDto({ status: "em_rota", versao: 1 }).motivo).toBeNull();
    expect(assertValidTransicaoEntregaDto({ status: "em_rota", versao: 1, motivo: " " }).motivo).toBeNull();
  });

  it.each([
    ["sem status", { versao: 1 }],
    ["status inexistente", { status: "saiu", versao: 1 }],
    ["sem versão", { status: "em_rota" }],
    ["versão zero", { status: "em_rota", versao: 0 }],
    ["versão fracionada", { status: "em_rota", versao: 1.5 }],
    ["versão como texto", { status: "em_rota", versao: "1" }],
    ["motivo longo demais", { status: "cancelado", versao: 1, motivo: "a".repeat(256) }],
  ])("rejeita %s", (_caso, body) => {
    expect(() => assertValidTransicaoEntregaDto(body)).toThrow(AppError);
  });
});
