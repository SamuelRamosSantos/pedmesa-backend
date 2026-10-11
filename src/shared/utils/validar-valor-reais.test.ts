import { describe, expect, it } from "vitest";
import { AppError } from "../errors/app-error";
import { validarValorReais, VALOR_REAIS_MAXIMO } from "./validar-valor-reais";

describe("validarValorReais", () => {
  it.each([0, 5, 7.5, 10.25, 0.01, 0.1 + 0.2, VALOR_REAIS_MAXIMO])("aceita %s", (valor) => {
    expect(validarValorReais(valor, "valor")).toBe(valor);
  });

  it.each([
    ["negativo", -0.01],
    ["mais de 2 casas decimais", 7.555],
    ["acima do limite de decimal(10,2)", VALOR_REAIS_MAXIMO + 0.01],
    ["texto", "7.50"],
    ["NaN", Number.NaN],
    ["infinito", Number.POSITIVE_INFINITY],
    ["null", null],
  ])("rejeita %s", (_caso, valor) => {
    expect(() => validarValorReais(valor, "valor")).toThrow(AppError);
  });

  it("usa o nome do campo na mensagem", () => {
    expect(() => validarValorReais(-1, "taxa_entrega_padrao")).toThrow(
      "taxa_entrega_padrao deve ser um número maior ou igual a zero."
    );
  });
});
