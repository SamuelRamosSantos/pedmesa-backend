import { describe, expect, it } from "vitest";
import { StatusItem } from "../entities/item-pedido.entity";
import { StatusPreparo } from "../entities/pedido.entity";
import { resolveStatusItemInicial } from "./item-status-inicial";
import { calcularStatusPreparoPedido } from "./status-preparo-calculator";

describe("calcularStatusPreparoPedido", () => {
  it("retorna pendente quando todos os itens estão pendentes", () => {
    expect(calcularStatusPreparoPedido([StatusItem.PENDENTE, StatusItem.PENDENTE])).toBe(StatusPreparo.PENDENTE);
  });

  it("retorna em_preparo quando há mescla entre pendente e em_preparo", () => {
    expect(calcularStatusPreparoPedido([StatusItem.PENDENTE, StatusItem.EM_PREPARO])).toBe(StatusPreparo.EM_PREPARO);
  });

  it("retorna em_preparo quando pelo menos um item está em preparo", () => {
    expect(calcularStatusPreparoPedido([StatusItem.EM_PREPARO, StatusItem.EM_PREPARO])).toBe(StatusPreparo.EM_PREPARO);
  });

  it("retorna pronto quando todos os itens estão prontos", () => {
    expect(calcularStatusPreparoPedido([StatusItem.PRONTO, StatusItem.PRONTO])).toBe(StatusPreparo.PRONTO);
  });

  it("retorna pronto quando há mescla entre pronto e entregue", () => {
    expect(calcularStatusPreparoPedido([StatusItem.PRONTO, StatusItem.ENTREGUE])).toBe(StatusPreparo.PRONTO);
  });

  it("retorna entregue quando todos os itens estão entregues", () => {
    expect(calcularStatusPreparoPedido([StatusItem.ENTREGUE, StatusItem.ENTREGUE])).toBe(StatusPreparo.ENTREGUE);
  });

  it("ignora itens cancelados ao calcular o status do pedido pai", () => {
    expect(calcularStatusPreparoPedido([StatusItem.PRONTO, StatusItem.CANCELADO])).toBe(StatusPreparo.PRONTO);
    expect(calcularStatusPreparoPedido([StatusItem.PENDENTE, StatusItem.CANCELADO])).toBe(StatusPreparo.PENDENTE);
  });

  it("retorna entregue quando todos os itens do pedido foram cancelados", () => {
    expect(calcularStatusPreparoPedido([StatusItem.CANCELADO, StatusItem.CANCELADO])).toBe(StatusPreparo.ENTREGUE);
  });

  it("retorna em_preparo para uma mescla geral (pendente + pronto)", () => {
    expect(calcularStatusPreparoPedido([StatusItem.PENDENTE, StatusItem.PRONTO])).toBe(StatusPreparo.EM_PREPARO);
  });

  describe("pedido recém-criado com produtos auto-pronto (precisa_preparo = false)", () => {
    it("nasce pronto quando todos os itens são de produtos que não precisam de preparo", () => {
      const statusDosItens = [false, false].map((precisaPreparo) => resolveStatusItemInicial(precisaPreparo, true));
      expect(calcularStatusPreparoPedido(statusDosItens)).toBe(StatusPreparo.PRONTO);
    });

    it("nasce pendente quando todos os itens são de produtos que precisam de preparo", () => {
      const statusDosItens = [true, true].map((precisaPreparo) => resolveStatusItemInicial(precisaPreparo, true));
      expect(calcularStatusPreparoPedido(statusDosItens)).toBe(StatusPreparo.PENDENTE);
    });

    it("nasce em_preparo quando o pedido mistura item auto-pronto com item que precisa de preparo", () => {
      const statusDosItens = [true, false].map((precisaPreparo) => resolveStatusItemInicial(precisaPreparo, true));
      expect(calcularStatusPreparoPedido(statusDosItens)).toBe(StatusPreparo.EM_PREPARO);
    });
  });
});
