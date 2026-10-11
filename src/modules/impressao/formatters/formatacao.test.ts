import { describe, expect, it } from "vitest";
import { formatarCep, formatarMoeda, formatarTelefone, identificacaoDoPedido } from "./formatacao";

describe("formatacao dos cupons", () => {
  it("formata moeda com vírgula", () => {
    expect(formatarMoeda(46.4)).toBe("R$ 46,40");
    expect(formatarMoeda(0)).toBe("R$ 0,00");
  });

  it("formata celular, fixo e mantém o resto como veio", () => {
    expect(formatarTelefone("11987654321")).toBe("(11) 98765-4321");
    expect(formatarTelefone("3335211234")).toBe("(33) 3521-1234");
    expect(formatarTelefone("123")).toBe("123");
  });

  it("formata CEP", () => {
    expect(formatarCep("01310100")).toBe("01310-100");
    expect(formatarCep("123")).toBe("123");
  });

  it("identifica mesa pelo número da comanda", () => {
    expect(identificacaoDoPedido(12, null)).toBe("Comanda/Mesa: #12");
    expect(identificacaoDoPedido(0, null)).toBe("Comanda/Mesa: #0");
  });

  it("identifica delivery como DELIVERY #0007", () => {
    expect(identificacaoDoPedido(null, 7)).toBe("DELIVERY #0007");
    expect(identificacaoDoPedido(null, 12345)).toBe("DELIVERY #12345");
  });

  it("sem nenhum número, não quebra", () => {
    expect(identificacaoDoPedido(null, null)).toBe("Pedido sem identificação");
  });
});
