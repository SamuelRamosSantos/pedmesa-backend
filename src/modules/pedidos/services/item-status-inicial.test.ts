import { describe, expect, it } from "vitest";
import { StatusItem } from "../entities/item-pedido.entity";
import { resolveStatusItemInicial } from "./item-status-inicial";

describe("resolveStatusItemInicial", () => {
  it("nasce como pendente quando o produto precisa de preparo e o módulo de cozinha está ativo", () => {
    expect(resolveStatusItemInicial(true, true)).toBe(StatusItem.PENDENTE);
  });

  it("nasce como pronto (auto-pronto) quando o produto não precisa de preparo", () => {
    expect(resolveStatusItemInicial(false, true)).toBe(StatusItem.PRONTO);
  });

  it("nasce como pronto quando o módulo de cozinha está desativado, mesmo que o produto precise de preparo", () => {
    expect(resolveStatusItemInicial(true, false)).toBe(StatusItem.PRONTO);
  });

  it("nasce como pronto quando o módulo de cozinha está desativado e o produto não precisa de preparo", () => {
    expect(resolveStatusItemInicial(false, false)).toBe(StatusItem.PRONTO);
  });
});
