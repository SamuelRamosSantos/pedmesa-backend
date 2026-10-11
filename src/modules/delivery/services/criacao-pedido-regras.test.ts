import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { FormaPagamento } from "../../comandas/entities/pagamento-comanda.entity";
import { StatusPreparo } from "../../pedidos/entities/pedido.entity";
import { StatusEntrega } from "../entities/entrega.entity";
import { CotacaoPedido } from "./cotacao-pedido";
import { assertCotacaoPermiteCriacao, calcularPrevisaoEntrega, statusInicialDaEntrega } from "./criacao-pedido-regras";

const COTACAO_OK: CotacaoPedido = {
  atendido: true,
  motivoNaoAtendido: null,
  subtotal: 38.9,
  taxaEntrega: 7.5,
  origemTaxa: "bairro",
  tempoEstimadoMin: 40,
  total: 46.4,
  pedidoMinimo: 30,
  pedidoMinimoAtingido: true,
  troco: 0,
  trocoSuficiente: true,
};

describe("assertCotacaoPermiteCriacao", () => {
  it("aceita cotação atendida, com pedido mínimo e sem troco", () => {
    expect(() => assertCotacaoPermiteCriacao(COTACAO_OK, FormaPagamento.PIX, null)).not.toThrow();
  });

  it("recusa bairro não atendido com o motivo da cotação", () => {
    const naoAtendido = { ...COTACAO_OK, atendido: false, motivoNaoAtendido: "O bairro Moema (São Paulo) não é atendido pelo delivery." };
    expect(() => assertCotacaoPermiteCriacao(naoAtendido, FormaPagamento.PIX, null)).toThrow(naoAtendido.motivoNaoAtendido);
  });

  it("recusa pedido mínimo não atingido mostrando mínimo e soma dos itens", () => {
    expect(() =>
      assertCotacaoPermiteCriacao({ ...COTACAO_OK, pedidoMinimo: 40, pedidoMinimoAtingido: false }, FormaPagamento.PIX, null)
    ).toThrow("O pedido mínimo para delivery é R$ 40.00; os itens somam R$ 38.90.");
  });

  it("recusa troco insuficiente e troco acima do limite", () => {
    expect(() => assertCotacaoPermiteCriacao(COTACAO_OK, FormaPagamento.DINHEIRO, 4_000)).toThrow(AppError);
    expect(() => assertCotacaoPermiteCriacao(COTACAO_OK, FormaPagamento.DINHEIRO, 100_000)).toThrow(AppError);
    expect(() => assertCotacaoPermiteCriacao(COTACAO_OK, FormaPagamento.DINHEIRO, 5_000)).not.toThrow();
  });
});

describe("statusInicialDaEntrega", () => {
  it.each([
    [StatusPreparo.PENDENTE, StatusEntrega.EM_PRODUCAO],
    [StatusPreparo.EM_PREPARO, StatusEntrega.EM_PRODUCAO],
    [StatusPreparo.PRONTO, StatusEntrega.PRONTO_PARA_ENVIO],
    [StatusPreparo.ENTREGUE, StatusEntrega.PRONTO_PARA_ENVIO],
  ])("preparo %s → entrega %s", (preparo, esperado) => {
    expect(statusInicialDaEntrega(preparo)).toBe(esperado);
  });
});

describe("calcularPrevisaoEntrega", () => {
  it("soma os minutos estimados ao horário atual", () => {
    expect(calcularPrevisaoEntrega(new Date("2026-10-10T15:00:00Z"), 40)).toEqual(new Date("2026-10-10T15:40:00Z"));
  });

  it("sem estimativa, sem previsão", () => {
    expect(calcularPrevisaoEntrega(new Date(), null)).toBeNull();
  });
});
