import { describe, expect, it } from "vitest";
import { normalizarLocalidade } from "./localidade-normalizer";

describe("normalizarLocalidade", () => {
  it("'Jardim São Paulo' e 'jardim sao  paulo' resultam na mesma chave", () => {
    expect(normalizarLocalidade("Jardim São Paulo")).toBe("jardim sao paulo");
    expect(normalizarLocalidade("jardim sao  paulo")).toBe("jardim sao paulo");
  });

  it.each([
    ["remove acentos e cedilha", "Conceição de Macabu", "conceicao de macabu"],
    ["converte para minúsculas", "BELA VISTA", "bela vista"],
    ["apara as pontas", "  Centro  ", "centro"],
    ["colapsa tabs, quebras de linha e espaço não separável", "Vila\t\nMariana Alta", "vila mariana alta"],
    ["mantém hífen e apóstrofo", "Santa Bárbara d'Oeste - SP", "santa barbara d'oeste - sp"],
  ])("%s", (_caso, entrada, esperado) => {
    expect(normalizarLocalidade(entrada)).toBe(esperado);
  });

  it("devolve string vazia para texto só com espaços", () => {
    expect(normalizarLocalidade("   ")).toBe("");
  });
});
