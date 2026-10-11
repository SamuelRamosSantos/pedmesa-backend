import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { StatusItem } from "../../pedidos/entities/item-pedido.entity";
import { DescontoTipo } from "../entities/comanda.entity";
import { calcularDesconto, ratearDescontoPorIntegrante } from "./desconto-calculator";
import { calcularExtrato } from "./extrato-calculator";
import { avaliarFechamento } from "./fechamento-calculator";
import { calcularTotalComEntrega, somarTaxaEntregaAoRateio } from "./total-com-entrega-calculator";

const SEM_DESCONTO = { tipo: DescontoTipo.NENHUM, valor: 0 };

describe("calcularExtrato com taxa de entrega", () => {
  const itens = [
    { id: "i1", produtoNome: "X-Burger", quantidade: 2, precoUnitario: 19.45, integranteId: "cliente", statusItem: StatusItem.PRONTO },
  ];
  const integrantes = [{ id: "cliente", nome: "Maria" }];

  it("expõe a taxa no resumo e mantém valor_total_comanda só com os itens (base do desconto)", () => {
    const { resumo_financeiro } = calcularExtrato({ itens, integrantes, taxaEntrega: 7.5 });

    expect(resumo_financeiro.valor_total_comanda).toBe(38.9);
    expect(resumo_financeiro.taxa_entrega).toBe(7.5);
    expect(resumo_financeiro.valor_total_com_entrega).toBe(46.4);
  });

  it("sem taxa informada (mesa) a taxa é 0 e os totais coincidem", () => {
    const { resumo_financeiro } = calcularExtrato({ itens, integrantes });

    expect(resumo_financeiro.taxa_entrega).toBe(0);
    expect(resumo_financeiro.valor_total_com_entrega).toBe(resumo_financeiro.valor_total_comanda);
  });
});

describe("calcularTotalComEntrega", () => {
  it("delivery sem desconto: itens + taxa", () => {
    expect(calcularTotalComEntrega(38.9, SEM_DESCONTO, 7.5)).toEqual({
      subtotal: 38.9,
      desconto_aplicado: 0,
      taxa_entrega: 7.5,
      total_final: 46.4,
    });
  });

  it("delivery com desconto percentual: 10% sobre os itens, a taxa fica inteira", () => {
    expect(calcularTotalComEntrega(50, { tipo: DescontoTipo.PERCENTUAL, valor: 10 }, 7.5)).toEqual({
      subtotal: 50,
      desconto_aplicado: 5,
      taxa_entrega: 7.5,
      total_final: 52.5,
    });
  });

  it("delivery com desconto em valor fixo: abate dos itens e soma a taxa", () => {
    expect(calcularTotalComEntrega(50, { tipo: DescontoTipo.VALOR_FIXO, valor: 12.3 }, 6).total_final).toBe(43.7);
  });

  it("desconto maior que os itens é recusado, mesmo que caiba em itens + taxa (a taxa nunca é descontada)", () => {
    expect(() => calcularTotalComEntrega(20, { tipo: DescontoTipo.VALOR_FIXO, valor: 25 }, 10)).toThrow(AppError);
  });

  it("desconto de 100% zera os itens, mas a taxa continua sendo cobrada", () => {
    expect(calcularTotalComEntrega(40, { tipo: DescontoTipo.PERCENTUAL, valor: 100 }, 8).total_final).toBe(8);
  });

  it("mesa (taxa 0) dá exatamente o mesmo resultado de calcularDesconto", () => {
    const desconto = { tipo: DescontoTipo.PERCENTUAL, valor: 15 };
    const mesa = calcularTotalComEntrega(87.35, desconto, 0);
    const original = calcularDesconto(87.35, desconto);

    expect(mesa.subtotal).toBe(original.subtotal);
    expect(mesa.desconto_aplicado).toBe(original.desconto_aplicado);
    expect(mesa.total_final).toBe(original.total_final);
    expect(mesa.taxa_entrega).toBe(0);
  });

  it("soma em centavos, sem erro de ponto flutuante", () => {
    expect(calcularTotalComEntrega(0.1, SEM_DESCONTO, 0.2).total_final).toBe(0.3);
  });

  it("taxa negativa é erro de programação", () => {
    expect(() => calcularTotalComEntrega(10, SEM_DESCONTO, -1)).toThrow(Error);
  });

  it("o total com taxa é o que o pagamento precisa cobrir no fechamento", () => {
    const total = calcularTotalComEntrega(38.9, SEM_DESCONTO, 7.5).total_final;

    expect(avaliarFechamento(total, [{ valor: 38.9 }]).suficiente).toBe(false);
    expect(avaliarFechamento(total, [{ valor: 46.4 }]).suficiente).toBe(true);
  });
});

describe("somarTaxaEntregaAoRateio", () => {
  it("delivery (um integrante): a taxa entra no total do cliente e a soma bate com o total_final", () => {
    const total = calcularTotalComEntrega(50, { tipo: DescontoTipo.PERCENTUAL, valor: 10 }, 7.5);
    const rateio = somarTaxaEntregaAoRateio(
      ratearDescontoPorIntegrante([{ integranteId: "c", nome: "Maria", totalAPagar: 50 }], total.desconto_aplicado),
      total.taxa_entrega
    );

    expect(rateio).toEqual([
      { integrante_id: "c", nome: "Maria", total_original: 57.5, desconto_aplicado: 5, total_a_pagar: 52.5 },
    ]);
    expect(rateio[0].total_a_pagar).toBe(total.total_final);
  });

  it("com vários integrantes, só o último recebe a taxa e a soma continua batendo", () => {
    const rateio = somarTaxaEntregaAoRateio(
      ratearDescontoPorIntegrante(
        [
          { integranteId: "a", nome: "A", totalAPagar: 30 },
          { integranteId: "b", nome: "B", totalAPagar: 20 },
        ],
        0
      ),
      5
    );

    expect(rateio.map((r) => r.total_a_pagar)).toEqual([30, 25]);
  });

  it("taxa 0 (mesa) devolve o rateio sem mudanças", () => {
    const original = ratearDescontoPorIntegrante([{ integranteId: "a", nome: "A", totalAPagar: 30 }], 3);

    expect(somarTaxaEntregaAoRateio(original, 0)).toBe(original);
  });
});
