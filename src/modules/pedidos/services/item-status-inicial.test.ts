import { describe, expect, it } from "vitest";
import { StatusItem } from "../entities/item-pedido.entity";
import { resolveStatusItemInicial } from "./item-status-inicial";

describe("resolveStatusItemInicial", () => {
  it("nasce como pendente quando o produto precisa de preparo", () => {
    expect(resolveStatusItemInicial(true)).toBe(StatusItem.PENDENTE);
  });

  it("nasce como pronto (auto-pronto) quando o produto não precisa de preparo", () => {
    expect(resolveStatusItemInicial(false)).toBe(StatusItem.PRONTO);
  });
});
