import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { assertValidCreateTaxaEntregaDto } from "./create-taxa-entrega.dto";

const VALID_BODY = { cidade: " São Paulo ", bairro: "Bela Vista", valor: 7.5, tempo_estimado_min: 40 };

describe("assertValidCreateTaxaEntregaDto", () => {
  it("aceita uma taxa válida, apara textos e liga a taxa por padrão", () => {
    expect(assertValidCreateTaxaEntregaDto(VALID_BODY)).toEqual({
      cidade: "São Paulo",
      bairro: "Bela Vista",
      valor: 7.5,
      tempoEstimadoMin: 40,
      ativo: true,
    });
  });

  it("aceita taxa grátis (valor 0), sem tempo estimado e já desativada", () => {
    expect(
      assertValidCreateTaxaEntregaDto({ cidade: "Santos", bairro: "Centro", valor: 0, tempo_estimado_min: null, ativo: false })
    ).toEqual({ cidade: "Santos", bairro: "Centro", valor: 0, tempoEstimadoMin: null, ativo: false });
  });

  it("ignora tenant_id vindo do corpo", () => {
    expect(assertValidCreateTaxaEntregaDto({ ...VALID_BODY, tenant_id: "outro" })).not.toHaveProperty("tenant_id");
  });

  it.each([
    ["cidade ausente", { cidade: undefined }],
    ["bairro em branco", { bairro: "  " }],
    ["bairro longo demais", { bairro: "a".repeat(121) }],
    ["valor ausente", { valor: undefined }],
    ["valor negativo", { valor: -1 }],
    ["valor com 3 casas decimais", { valor: 7.555 }],
    ["valor como texto", { valor: "7.50" }],
    ["tempo zero", { tempo_estimado_min: 0 }],
    ["tempo fracionado", { tempo_estimado_min: 30.5 }],
    ["tempo acima de 24h", { tempo_estimado_min: 1441 }],
    ["ativo como texto", { ativo: "sim" }],
  ])("rejeita %s", (_caso, alteracao) => {
    expect(() => assertValidCreateTaxaEntregaDto({ ...VALID_BODY, ...alteracao })).toThrow(AppError);
  });
});
