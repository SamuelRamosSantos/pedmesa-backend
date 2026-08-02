import { describe, expect, it } from "vitest";
import { avaliarFechamento } from "./fechamento-calculator";

describe("avaliarFechamento", () => {
  it("considera suficiente quando o pagamento é exatamente igual ao total da comanda", () => {
    const resultado = avaliarFechamento(75.0, [{ valor: 75.0 }]);

    expect(resultado.totalComandaCents).toBe(7500);
    expect(resultado.totalPagoCents).toBe(7500);
    expect(resultado.saldoCents).toBe(0);
    expect(resultado.suficiente).toBe(true);
  });

  it("soma múltiplas formas de pagamento", () => {
    const resultado = avaliarFechamento(75.0, [{ valor: 40.0 }, { valor: 35.0 }]);

    expect(resultado.totalPagoCents).toBe(7500);
    expect(resultado.suficiente).toBe(true);
  });

  it("considera suficiente quando há troco (pagamento maior que o total)", () => {
    const resultado = avaliarFechamento(75.0, [{ valor: 100.0 }]);

    expect(resultado.saldoCents).toBe(2500);
    expect(resultado.suficiente).toBe(true);
  });

  it("rejeita quando o pagamento é insuficiente", () => {
    const resultado = avaliarFechamento(75.0, [{ valor: 50.0 }]);

    expect(resultado.saldoCents).toBe(-2500);
    expect(resultado.suficiente).toBe(false);
  });

  it("aceita uma diferença de até 1 centavo por tolerância de arredondamento", () => {
    const resultado = avaliarFechamento(10.0, [{ valor: 9.99 }]);

    expect(resultado.saldoCents).toBe(-1);
    expect(resultado.suficiente).toBe(true);
  });

  it("rejeita uma diferença de 2 centavos ou mais", () => {
    const resultado = avaliarFechamento(10.0, [{ valor: 9.98 }]);

    expect(resultado.saldoCents).toBe(-2);
    expect(resultado.suficiente).toBe(false);
  });

  it("não sofre erros de ponto flutuante ao somar pagamentos fracionados", () => {
    // 0.1 + 0.2 !== 0.3 em JS puro
    const resultado = avaliarFechamento(0.3, [{ valor: 0.1 }, { valor: 0.2 }]);

    expect(resultado.totalPagoCents).toBe(30);
    expect(resultado.saldoCents).toBe(0);
    expect(resultado.suficiente).toBe(true);
  });

  it("trata lista de pagamentos vazia como valor pago zero", () => {
    const resultado = avaliarFechamento(10.0, []);

    expect(resultado.totalPagoCents).toBe(0);
    expect(resultado.suficiente).toBe(false);
  });

  it("considera uma comanda de valor zero sempre quitável", () => {
    const resultado = avaliarFechamento(0, []);

    expect(resultado.suficiente).toBe(true);
    expect(resultado.saldoCents).toBe(0);
  });
});
