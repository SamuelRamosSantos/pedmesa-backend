import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { toCents } from "../../../shared/utils/money";
import { FormaPagamento } from "../../comandas/entities/pagamento-comanda.entity";
import { assertTrocoValidoNaCriacao, calcularTroco, TROCO_MAXIMO_CENTS } from "./troco-calculator";

const dinheiro = (totalCents: number, trocoParaCents: number | null) => ({
  totalCents,
  formaPrevista: FormaPagamento.DINHEIRO,
  trocoParaCents,
});

describe("calcularTroco", () => {
  it.each([
    ["valor exato", 4_550, 4_550, { trocoCents: 0, suficiente: true }],
    ["1 centavo a mais", 4_550, 4_551, { trocoCents: 1, suficiente: true }],
    ["1 centavo a menos", 4_550, 4_549, { trocoCents: 0, suficiente: false }],
    ["nota de 50 para R$ 45,50", 4_550, 5_000, { trocoCents: 450, suficiente: true }],
  ])("%s", (_caso, totalCents, trocoParaCents, esperado) => {
    expect(calcularTroco(dinheiro(totalCents, trocoParaCents))).toEqual(esperado);
  });

  it("0.1 + 0.2 em reais vira 30 centavos exatos, sem erro de ponto flutuante", () => {
    const totalCents = toCents(0.1 + 0.2);
    expect(calcularTroco(dinheiro(totalCents, toCents(0.3)))).toEqual({ trocoCents: 0, suficiente: true });
  });

  it("total com taxa de entrega: itens + taxa somados em centavos", () => {
    const totalCents = toCents(38.9) + toCents(7.5);
    expect(totalCents).toBe(4_640);
    expect(calcularTroco(dinheiro(totalCents, toCents(50)))).toEqual({ trocoCents: 360, suficiente: true });
  });

  it("troco_para null significa valor exato: troco 0, em qualquer forma de pagamento", () => {
    expect(calcularTroco(dinheiro(4_550, null))).toEqual({ trocoCents: 0, suficiente: true });
    expect(calcularTroco({ totalCents: 4_550, formaPrevista: FormaPagamento.PIX, trocoParaCents: null })).toEqual({
      trocoCents: 0,
      suficiente: true,
    });
  });

  it.each([FormaPagamento.PIX, FormaPagamento.CARTAO_CREDITO, FormaPagamento.CARTAO_DEBITO])(
    "troco_para com %s lança AppError 400",
    (formaPrevista) => {
      expect(() => calcularTroco({ totalCents: 4_550, formaPrevista, trocoParaCents: 5_000 })).toThrow(
        expect.objectContaining({ statusCode: 400 })
      );
      expect(() => calcularTroco({ totalCents: 4_550, formaPrevista, trocoParaCents: 5_000 })).toThrow(AppError);
    }
  );

  it("insuficiente não lança: leituras posteriores só sinalizam", () => {
    expect(() => calcularTroco(dinheiro(10_000, 5_000))).not.toThrow();
  });

  it.each([
    ["total em reais em vez de centavos", 45.5, 5_000],
    ["troco_para em reais em vez de centavos", 4_550, 50.25],
    ["total negativo", -1, 5_000],
  ])("recusa %s (erro de programação, não AppError)", (_caso, totalCents, trocoParaCents) => {
    expect(() => calcularTroco(dinheiro(totalCents, trocoParaCents))).toThrow(Error);
    expect(() => calcularTroco(dinheiro(totalCents, trocoParaCents))).not.toThrow(AppError);
  });
});

describe("assertTrocoValidoNaCriacao", () => {
  it("devolve o troco quando é válido", () => {
    expect(assertTrocoValidoNaCriacao(dinheiro(4_550, 5_000))).toEqual({ trocoCents: 450, suficiente: true });
  });

  it("recusa troco_para menor que o total com AppError 400", () => {
    expect(() => assertTrocoValidoNaCriacao(dinheiro(4_550, 4_549))).toThrow(
      expect.objectContaining({
        statusCode: 400,
        message: "O valor para troco (R$ 45.49) é menor que o total do pedido (R$ 45.50).",
      })
    );
  });

  it("aceita troco exatamente no limite e recusa 1 centavo acima", () => {
    expect(assertTrocoValidoNaCriacao(dinheiro(1_000, 1_000 + TROCO_MAXIMO_CENTS)).trocoCents).toBe(TROCO_MAXIMO_CENTS);
    expect(() => assertTrocoValidoNaCriacao(dinheiro(1_000, 1_000 + TROCO_MAXIMO_CENTS + 1))).toThrow(
      expect.objectContaining({ statusCode: 400 })
    );
  });

  it("limite pega o caso de digitar 1000 no lugar de 100", () => {
    expect(() => assertTrocoValidoNaCriacao(dinheiro(toCents(85), toCents(1000)))).toThrow(AppError);
    expect(assertTrocoValidoNaCriacao(dinheiro(toCents(85), toCents(100))).trocoCents).toBe(toCents(15));
  });

  it("sem troco_para é sempre válido", () => {
    expect(assertTrocoValidoNaCriacao(dinheiro(4_550, null))).toEqual({ trocoCents: 0, suficiente: true });
  });
});
