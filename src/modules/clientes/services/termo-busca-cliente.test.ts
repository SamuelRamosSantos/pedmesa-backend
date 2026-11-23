import { describe, expect, it } from "vitest";
import {
  interpretarTermoBusca,
  LETRAS_ACENTUADAS,
  LETRAS_SEM_ACENTO,
  normalizarParaBusca,
  padraoContem,
} from "./termo-busca-cliente";

describe("interpretarTermoBusca", () => {
  it.each([null, "", "   "])("termo vazio (%j) lista todos", (termo) => {
    expect(interpretarTermoBusca(termo)).toEqual({ tipo: "todos" });
  });

  it.each([
    ["11987654321", "11987654321"],
    ["(11) 98765-4321", "11987654321"],
    ["+55 11 9876", "55119876"],
    ["9876", "9876"],
  ])(
    "só dígitos, com ou sem máscara (%s), busca pelo telefone",
    (termo, digitos) => {
      expect(interpretarTermoBusca(termo)).toEqual({
        tipo: "telefone",
        digitos,
      });
    },
  );

  it("com letras busca pelo nome, palavra a palavra, sem acento e em minúsculas", () => {
    expect(interpretarTermoBusca("  José   da  SILVA ")).toEqual({
      tipo: "nome",
      palavras: ["jose", "da", "silva"],
    });
  });

  it("letras e dígitos juntos contam como nome", () => {
    expect(interpretarTermoBusca("Ap 12")).toEqual({
      tipo: "nome",
      palavras: ["ap", "12"],
    });
  });

  it("ignora palavras repetidas e limita a 5", () => {
    expect(interpretarTermoBusca("a a b c d e f g")).toEqual({
      tipo: "nome",
      palavras: ["a", "b", "c", "d", "e"],
    });
  });
});

describe("normalizarParaBusca", () => {
  it("tira acentos e passa para minúsculas", () => {
    expect(normalizarParaBusca("JOSÉ Conceição Ñandú")).toBe(
      "jose conceicao nandu",
    );
  });

  it("os pares do translate() têm o mesmo tamanho e batem com a normalização", () => {
    expect([...LETRAS_ACENTUADAS]).toHaveLength([...LETRAS_SEM_ACENTO].length);
    expect(normalizarParaBusca(LETRAS_ACENTUADAS)).toBe(
      LETRAS_SEM_ACENTO.toLowerCase(),
    );
  });
});

describe("padraoContem", () => {
  it("envolve o texto em % para buscar por trecho", () => {
    expect(padraoContem("maria")).toBe("%maria%");
  });

  it("escapa %, _ e \\ do usuário", () => {
    expect(padraoContem("50%_a\\b")).toBe("%50\\%\\_a\\\\b%");
  });
});
