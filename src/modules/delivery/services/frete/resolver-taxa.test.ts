import { describe, expect, it } from "vitest";
import { resolverTaxa, TaxaCandidata } from "./resolver-taxa";

const taxa = (bairroNormalizado: string, valor: number, extra: Partial<TaxaCandidata> = {}): TaxaCandidata => ({
  cidadeNormalizada: "sao paulo",
  bairroNormalizado,
  valor,
  tempoEstimadoMin: 40,
  ativo: true,
  ...extra,
});

const TAXAS = [taxa("jardim sao paulo", 7.5), taxa("pinheiros", 9, { tempoEstimadoMin: null }), taxa("vila mariana", 10.5, { ativo: false })];

describe("resolverTaxa", () => {
  it("usa a taxa do bairro, comparando sem acento, caixa ou espaços extras", () => {
    expect(resolverTaxa(TAXAS, { cidade: " SÃO PAULO ", bairro: "Jardim  São Paulo" }, 6)).toEqual({
      atendido: true,
      valor: 7.5,
      tempoEstimadoMin: 40,
      origem: "bairro",
    });
  });

  it("bairro sem estimativa devolve tempoEstimadoMin null", () => {
    expect(resolverTaxa(TAXAS, { cidade: "São Paulo", bairro: "Pinheiros" }, null)).toMatchObject({ valor: 9, tempoEstimadoMin: null });
  });

  it("bairro sem taxa cai na taxa padrão", () => {
    expect(resolverTaxa(TAXAS, { cidade: "São Paulo", bairro: "Moema" }, 6)).toEqual({
      atendido: true,
      valor: 6,
      tempoEstimadoMin: null,
      origem: "padrao",
    });
  });

  it("bairro com taxa desativada cai na taxa padrão", () => {
    expect(resolverTaxa(TAXAS, { cidade: "São Paulo", bairro: "Vila Mariana" }, 6)).toMatchObject({ valor: 6, origem: "padrao" });
  });

  it("taxa padrão zero (frete grátis fora da lista) também atende", () => {
    expect(resolverTaxa(TAXAS, { cidade: "São Paulo", bairro: "Moema" }, 0)).toMatchObject({ atendido: true, valor: 0 });
  });

  it("mesmo bairro em outra cidade não usa a taxa da cidade errada", () => {
    expect(resolverTaxa(TAXAS, { cidade: "Guarulhos", bairro: "Jardim São Paulo" }, null)).toMatchObject({ atendido: false });
  });

  it("sem taxa padrão, bairro fora da lista não é atendido, com motivo legível", () => {
    expect(resolverTaxa(TAXAS, { cidade: "São Paulo", bairro: " Moema " }, null)).toEqual({
      atendido: false,
      motivo: "O bairro Moema (São Paulo) não é atendido pelo delivery.",
    });
  });

  it("sem taxa padrão, bairro com taxa desativada não é atendido", () => {
    expect(resolverTaxa(TAXAS, { cidade: "São Paulo", bairro: "Vila Mariana" }, null)).toMatchObject({ atendido: false });
  });
});
