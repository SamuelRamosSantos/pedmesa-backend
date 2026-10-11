import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { assertValidUpdateTaxaEntregaDto } from "./update-taxa-entrega.dto";

describe("assertValidUpdateTaxaEntregaDto", () => {
  it("valida só os campos enviados", () => {
    expect(assertValidUpdateTaxaEntregaDto({ valor: 9 })).toEqual({ valor: 9 });
    expect(assertValidUpdateTaxaEntregaDto({ ativo: false })).toEqual({ ativo: false });
    expect(assertValidUpdateTaxaEntregaDto({ bairro: " Pinheiros " })).toEqual({ bairro: "Pinheiros" });
  });

  it("tempo_estimado_min: null remove a estimativa e ausente não altera", () => {
    expect(assertValidUpdateTaxaEntregaDto({ tempo_estimado_min: null })).toEqual({ tempoEstimadoMin: null });
    expect(assertValidUpdateTaxaEntregaDto({ valor: 5 })).not.toHaveProperty("tempoEstimadoMin");
  });

  it.each([
    ["corpo vazio", {}],
    ["sem corpo", undefined],
    ["só campos desconhecidos", { tenant_id: "x" }],
    ["valor negativo", { valor: -0.5 }],
    ["cidade em branco", { cidade: "" }],
  ])("rejeita %s", (_caso, body) => {
    expect(() => assertValidUpdateTaxaEntregaDto(body)).toThrow(AppError);
  });
});
