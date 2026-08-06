import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { DescontoTipo } from "../entities/comanda.entity";
import { calcularDesconto, ratearDescontoPorIntegrante } from "./desconto-calculator";

describe("calcularDesconto", () => {
  it("não aplica desconto nenhum: total_final igual ao subtotal", () => {
    const resultado = calcularDesconto(100.0, { tipo: DescontoTipo.NENHUM, valor: 0 });

    expect(resultado).toEqual({ subtotal: 100.0, desconto_aplicado: 0, total_final: 100.0 });
  });

  it("aplica desconto percentual sobre o subtotal", () => {
    const resultado = calcularDesconto(200.0, { tipo: DescontoTipo.PERCENTUAL, valor: 10 });

    expect(resultado).toEqual({ subtotal: 200.0, desconto_aplicado: 20.0, total_final: 180.0 });
  });

  it("aplica desconto em valor fixo", () => {
    const resultado = calcularDesconto(150.0, { tipo: DescontoTipo.VALOR_FIXO, valor: 25.5 });

    expect(resultado).toEqual({ subtotal: 150.0, desconto_aplicado: 25.5, total_final: 124.5 });
  });

  it("permite desconto de 100% (comanda cortesia, total final zero)", () => {
    const resultado = calcularDesconto(80.0, { tipo: DescontoTipo.PERCENTUAL, valor: 100 });

    expect(resultado.total_final).toBe(0);
  });

  it("rejeita desconto em valor fixo maior que o subtotal", () => {
    expect(() => calcularDesconto(50.0, { tipo: DescontoTipo.VALOR_FIXO, valor: 60.0 })).toThrow(AppError);
  });

  it("rejeita desconto percentual acima de 100% (resultaria em valor negativo)", () => {
    expect(() => calcularDesconto(50.0, { tipo: DescontoTipo.PERCENTUAL, valor: 150 })).toThrow(AppError);
  });

  it("não sofre erro de ponto flutuante ao aplicar percentual", () => {
    // 33.33 * 10% = 3.333 -> arredonda para 3.33
    const resultado = calcularDesconto(33.33, { tipo: DescontoTipo.PERCENTUAL, valor: 10 });

    expect(resultado.desconto_aplicado).toBe(3.33);
    expect(resultado.total_final).toBe(30.0);
  });
});

describe("ratearDescontoPorIntegrante", () => {
  it("rateia o desconto proporcionalmente ao total de cada integrante", () => {
    const resultado = ratearDescontoPorIntegrante(
      [
        { integranteId: "lucas", nome: "Lucas", totalAPagar: 60.0 },
        { integranteId: "mariana", nome: "Mariana", totalAPagar: 40.0 },
      ],
      10.0
    );

    expect(resultado).toEqual([
      { integrante_id: "lucas", nome: "Lucas", total_original: 60.0, desconto_aplicado: 6.0, total_a_pagar: 54.0 },
      {
        integrante_id: "mariana",
        nome: "Mariana",
        total_original: 40.0,
        desconto_aplicado: 4.0,
        total_a_pagar: 36.0,
      },
    ]);
  });

  it("divide igualmente quando os integrantes têm o mesmo total", () => {
    const resultado = ratearDescontoPorIntegrante(
      [
        { integranteId: "a", nome: "A", totalAPagar: 50.0 },
        { integranteId: "b", nome: "B", totalAPagar: 50.0 },
      ],
      20.0
    );

    expect(resultado[0].desconto_aplicado).toBe(10.0);
    expect(resultado[1].desconto_aplicado).toBe(10.0);
  });

  it("o último integrante absorve o centavo de arredondamento, batendo exatamente com o desconto total", () => {
    const resultado = ratearDescontoPorIntegrante(
      [
        { integranteId: "a", nome: "A", totalAPagar: 33.33 },
        { integranteId: "b", nome: "B", totalAPagar: 33.33 },
        { integranteId: "c", nome: "C", totalAPagar: 33.34 },
      ],
      10.0
    );

    const somaDescontos = resultado.reduce((soma, item) => soma + item.desconto_aplicado, 0);
    expect(somaDescontos).toBeCloseTo(10.0, 2);
  });

  it("retorna desconto zero para todos quando o desconto total é zero", () => {
    const resultado = ratearDescontoPorIntegrante(
      [
        { integranteId: "a", nome: "A", totalAPagar: 30.0 },
        { integranteId: "b", nome: "B", totalAPagar: 20.0 },
      ],
      0
    );

    expect(resultado.every((item) => item.desconto_aplicado === 0)).toBe(true);
    expect(resultado[0].total_a_pagar).toBe(30.0);
    expect(resultado[1].total_a_pagar).toBe(20.0);
  });

  it("não quebra quando não há integrantes cadastrados", () => {
    expect(ratearDescontoPorIntegrante([], 10.0)).toEqual([]);
  });
});
