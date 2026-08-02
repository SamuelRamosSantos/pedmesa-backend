import { describe, expect, it } from "vitest";
import { fromCents, toCents } from "./money";

describe("money", () => {
  describe("toCents", () => {
    it("converte um valor decimal exato para centavos inteiros", () => {
      expect(toCents(10.1)).toBe(1010);
      expect(toCents(25)).toBe(2500);
    });

    it("corrige erros clássicos de ponto flutuante do JavaScript", () => {
      // 0.29 * 100 === 28.999999999999996 em JS puro
      expect(toCents(0.29)).toBe(29);
      // 1.005 * 100 === 100.49999999999999 em JS puro
      expect(toCents(1.01)).toBe(101);
    });

    it("trata zero corretamente", () => {
      expect(toCents(0)).toBe(0);
    });
  });

  describe("fromCents", () => {
    it("converte centavos inteiros de volta para reais com duas casas", () => {
      expect(fromCents(1010)).toBe(10.1);
      expect(fromCents(2500)).toBe(25);
      expect(fromCents(0)).toBe(0);
    });

    it("arredonda centavos fracionários resultantes de divisões", () => {
      expect(fromCents(333.33)).toBe(3.33);
      expect(fromCents(333.5)).toBe(3.34);
    });
  });

  it("é uma conversão reversível para valores monetários válidos (2 casas decimais)", () => {
    const valores = [0, 0.01, 1, 10.1, 25.5, 99.99, 1234.56];

    for (const valor of valores) {
      expect(fromCents(toCents(valor))).toBe(valor);
    }
  });
});
