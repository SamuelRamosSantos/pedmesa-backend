import { describe, expect, it } from "vitest";
import { deveSerPrincipal } from "./endereco-principal";

describe("deveSerPrincipal", () => {
  it("o primeiro endereço é sempre principal", () => {
    expect(deveSerPrincipal(false, 0)).toBe(true);
    expect(deveSerPrincipal(true, 0)).toBe(true);
  });

  it("depois do primeiro, segue o que foi pedido", () => {
    expect(deveSerPrincipal(false, 2)).toBe(false);
    expect(deveSerPrincipal(true, 2)).toBe(true);
  });
});
