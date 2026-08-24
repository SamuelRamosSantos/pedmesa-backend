import { describe, expect, it } from "vitest";
import { parseDurationToMs } from "./parse-duration";

describe("parseDurationToMs", () => {
  it("converte os formatos usados no projeto", () => {
    expect(parseDurationToMs("30m")).toBe(30 * 60 * 1000);
    expect(parseDurationToMs("1d")).toBe(24 * 60 * 60 * 1000);
    expect(parseDurationToMs("12h")).toBe(12 * 60 * 60 * 1000);
    expect(parseDurationToMs("500ms")).toBe(500);
    expect(parseDurationToMs("45s")).toBe(45 * 1000);
  });

  it("lança erro para formato desconhecido", () => {
    expect(() => parseDurationToMs("1y")).toThrow(/Formato de duração inválido/);
    expect(() => parseDurationToMs("abc")).toThrow(/Formato de duração inválido/);
    expect(() => parseDurationToMs("")).toThrow(/Formato de duração inválido/);
  });
});
