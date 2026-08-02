import { describe, expect, it } from "vitest";
import { StatusItem } from "../entities/item-pedido.entity";
import { assertTransicaoValida } from "./item-status-transition";

describe("assertTransicaoValida", () => {
  it.each([
    [StatusItem.PENDENTE, StatusItem.EM_PREPARO],
    [StatusItem.EM_PREPARO, StatusItem.PRONTO],
    [StatusItem.PRONTO, StatusItem.ENTREGUE],
  ])("permite avanço de %s para %s", (atual, novo) => {
    expect(() => assertTransicaoValida(atual, novo)).not.toThrow();
  });

  it.each([
    [StatusItem.EM_PREPARO, StatusItem.PENDENTE],
    [StatusItem.PRONTO, StatusItem.EM_PREPARO],
  ])("permite regressão (desfazer) de %s para %s", (atual, novo) => {
    expect(() => assertTransicaoValida(atual, novo)).not.toThrow();
  });

  it.each([
    [StatusItem.PENDENTE, StatusItem.CANCELADO],
    [StatusItem.EM_PREPARO, StatusItem.CANCELADO],
  ])("permite cancelar a partir de %s", (atual, novo) => {
    expect(() => assertTransicaoValida(atual, novo)).not.toThrow();
  });

  it("permite reabrir um item entregue de volta para pronto", () => {
    expect(() => assertTransicaoValida(StatusItem.ENTREGUE, StatusItem.PRONTO)).not.toThrow();
  });

  it("permite reabrir um item cancelado de volta para pendente", () => {
    expect(() => assertTransicaoValida(StatusItem.CANCELADO, StatusItem.PENDENTE)).not.toThrow();
  });

  it.each([
    [StatusItem.PENDENTE, StatusItem.PRONTO],
    [StatusItem.PENDENTE, StatusItem.ENTREGUE],
    [StatusItem.PRONTO, StatusItem.PENDENTE],
    [StatusItem.PRONTO, StatusItem.CANCELADO],
    [StatusItem.ENTREGUE, StatusItem.PENDENTE],
    [StatusItem.ENTREGUE, StatusItem.EM_PREPARO],
    [StatusItem.ENTREGUE, StatusItem.CANCELADO],
    [StatusItem.CANCELADO, StatusItem.EM_PREPARO],
    [StatusItem.CANCELADO, StatusItem.PRONTO],
  ])("rejeita transição inválida de %s para %s", (atual, novo) => {
    expect(() => assertTransicaoValida(atual, novo)).toThrow(/Transição de status inválida/);
  });

  it("rejeita definir o mesmo status já vigente", () => {
    expect(() => assertTransicaoValida(StatusItem.EM_PREPARO, StatusItem.EM_PREPARO)).toThrow(
      /já está com o status/
    );
  });
});
