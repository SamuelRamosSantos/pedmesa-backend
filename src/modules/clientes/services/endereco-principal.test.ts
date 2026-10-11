import { describe, expect, it } from "vitest";
import { deveSerPrincipal, proximoPrincipalAposRemocao } from "./endereco-principal";

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

describe("proximoPrincipalAposRemocao", () => {
  it("escolhe o endereço mais recente entre os que sobraram", () => {
    expect(
      proximoPrincipalAposRemocao([
        { id: "antigo", criadoEm: new Date("2026-01-10T10:00:00Z") },
        { id: "recente", criadoEm: new Date("2026-09-01T10:00:00Z") },
        { id: "meio", criadoEm: new Date("2026-05-01T10:00:00Z") },
      ])
    ).toBe("recente");
  });

  it("com um só endereço restante, ele vira o principal", () => {
    expect(proximoPrincipalAposRemocao([{ id: "unico", criadoEm: new Date() }])).toBe("unico");
  });

  it("sem endereços restantes, não há principal", () => {
    expect(proximoPrincipalAposRemocao([])).toBeNull();
  });
});
