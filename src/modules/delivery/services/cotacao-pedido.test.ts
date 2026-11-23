import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { DescontoTipo } from "../../comandas/entities/comanda.entity";
import { FormaPagamento } from "../../comandas/entities/pagamento-comanda.entity";
import { montarCotacaoPedido, somarSubtotalCents } from "./cotacao-pedido";

const ATENDIDO = {
  atendido: true as const,
  valor: 7.5,
  tempoEstimadoMin: 40,
  origem: "bairro" as const,
};
const NAO_ATENDIDO = {
  atendido: false as const,
  motivo: "O bairro Moema (São Paulo) não é atendido pelo delivery.",
};
const base = {
  subtotalCents: 3_890,
  frete: ATENDIDO,
  pedidoMinimoCents: 0,
  formaPagamento: FormaPagamento.PIX,
  trocoParaCents: null,
};

describe("somarSubtotalCents", () => {
  it("soma preço × quantidade em centavos, sem erro de ponto flutuante", () => {
    expect(
      somarSubtotalCents([
        { precoUnitario: 19.45, quantidade: 2 },
        { precoUnitario: 0.1, quantidade: 3 },
      ]),
    ).toBe(3_920);
  });
});

describe("montarCotacaoPedido", () => {
  it("bairro atendido: total = itens + taxa", () => {
    expect(montarCotacaoPedido(base)).toEqual({
      atendido: true,
      motivoNaoAtendido: null,
      subtotal: 38.9,
      taxaEntrega: 7.5,
      taxaEntregaBairro: 7.5,
      taxaIsenta: false,
      origemTaxa: "bairro",
      tempoEstimadoMin: 40,
      descontoAplicado: 0,
      descontoExcedeItens: false,
      total: 46.4,
      pedidoMinimo: 0,
      pedidoMinimoAtingido: true,
      troco: 0,
      trocoSuficiente: true,
    });
  });

  it("bairro não atendido: sem taxa, total só dos itens e motivo para a tela", () => {
    expect(montarCotacaoPedido({ ...base, frete: NAO_ATENDIDO })).toMatchObject(
      {
        atendido: false,
        motivoNaoAtendido: NAO_ATENDIDO.motivo,
        taxaEntrega: null,
        origemTaxa: null,
        tempoEstimadoMin: null,
        total: 38.9,
      },
    );
  });

  it("pedido mínimo compara só os itens, sem a taxa", () => {
    // 38,90 de itens + 7,50 de taxa = 46,40, mas o mínimo de 40 olha só os itens.
    expect(
      montarCotacaoPedido({ ...base, pedidoMinimoCents: 4_000 }),
    ).toMatchObject({ pedidoMinimo: 40, pedidoMinimoAtingido: false });
    expect(
      montarCotacaoPedido({ ...base, pedidoMinimoCents: 3_890 })
        .pedidoMinimoAtingido,
    ).toBe(true);
  });

  it("troco calculado sobre o total com taxa", () => {
    expect(
      montarCotacaoPedido({
        ...base,
        formaPagamento: FormaPagamento.DINHEIRO,
        trocoParaCents: 5_000,
      }),
    ).toMatchObject({ total: 46.4, troco: 3.6, trocoSuficiente: true });
  });

  it("troco para menor que o total só sinaliza, não lança (a tela mostra o aviso)", () => {
    expect(
      montarCotacaoPedido({
        ...base,
        formaPagamento: FormaPagamento.DINHEIRO,
        trocoParaCents: 4_000,
      }),
    ).toMatchObject({ troco: 0, trocoSuficiente: false });
  });

  describe("desconto e isenção da taxa (PED-126)", () => {
    it("isenção zera a taxa cobrada e guarda a do bairro para exibição", () => {
      expect(montarCotacaoPedido({ ...base, isentarTaxa: true })).toMatchObject(
        {
          taxaEntrega: 0,
          taxaEntregaBairro: 7.5,
          taxaIsenta: true,
          total: 38.9,
        },
      );
    });

    it("isenção não vale para bairro não atendido", () => {
      expect(
        montarCotacaoPedido({
          ...base,
          frete: NAO_ATENDIDO,
          isentarTaxa: true,
        }),
      ).toMatchObject({ taxaEntrega: null, taxaIsenta: false });
    });

    it("desconto percentual só sobre os itens; a taxa entra inteira", () => {
      // 10% de 38,90 = 3,89 → 35,01 + 7,50 = 42,51.
      expect(
        montarCotacaoPedido({
          ...base,
          desconto: { tipo: DescontoTipo.PERCENTUAL, valor: 10 },
        }),
      ).toMatchObject({ descontoAplicado: 3.89, total: 42.51 });
    });

    it("desconto fixo e isenção juntos; troco sobre o total final", () => {
      expect(
        montarCotacaoPedido({
          ...base,
          formaPagamento: FormaPagamento.DINHEIRO,
          trocoParaCents: 5_000,
          desconto: { tipo: DescontoTipo.VALOR_FIXO, valor: 8.9 },
          isentarTaxa: true,
        }),
      ).toMatchObject({ descontoAplicado: 8.9, total: 30, troco: 20 });
    });

    it("desconto maior que os itens só sinaliza e fica fora do total", () => {
      expect(
        montarCotacaoPedido({
          ...base,
          desconto: { tipo: DescontoTipo.VALOR_FIXO, valor: 50 },
        }),
      ).toMatchObject({
        descontoExcedeItens: true,
        descontoAplicado: 0,
        total: 46.4,
      });
    });

    it("pedido mínimo continua sobre os itens antes do desconto", () => {
      expect(
        montarCotacaoPedido({
          ...base,
          pedidoMinimoCents: 3_890,
          desconto: { tipo: DescontoTipo.PERCENTUAL, valor: 50 },
        }).pedidoMinimoAtingido,
      ).toBe(true);
    });
  });

  it("troco informado com PIX é recusado (AppError 400)", () => {
    expect(() =>
      montarCotacaoPedido({ ...base, trocoParaCents: 5_000 }),
    ).toThrow(AppError);
  });
});
