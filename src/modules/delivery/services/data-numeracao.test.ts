import { describe, expect, it } from "vitest";
import { dataDaNumeracao } from "./data-numeracao";

describe("dataDaNumeracao", () => {
  it("usa o dia de Brasília, não o de UTC", () => {
    // 02:30 UTC do dia 3 ainda é 23:30 do dia 2 em Brasília.
    expect(dataDaNumeracao(new Date("2026-10-03T02:30:00Z"))).toBe("2026-10-02");
  });

  it("vira o dia à meia-noite de Brasília", () => {
    expect(dataDaNumeracao(new Date("2026-10-03T02:59:59Z"))).toBe("2026-10-02");
    expect(dataDaNumeracao(new Date("2026-10-03T03:00:00Z"))).toBe("2026-10-03");
  });

  it("formata como YYYY-MM-DD com zeros à esquerda", () => {
    expect(dataDaNumeracao(new Date("2026-01-05T15:00:00Z"))).toBe("2026-01-05");
  });

  it("aceita outro fuso quando informado", () => {
    expect(dataDaNumeracao(new Date("2026-10-03T02:30:00Z"), "UTC")).toBe("2026-10-03");
  });
});
