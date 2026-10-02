import { describe, expect, it } from "vitest";
import { normalizarTelefone } from "./telefone-normalizer";

describe("normalizarTelefone", () => {
  it.each([
    ["(11) 98765-4321", "11987654321"],
    ["11987654321", "11987654321"],
    ["11 9 8765 4321", "11987654321"],
    ["+55 (11) 98765-4321", "11987654321"],
    ["5511987654321", "11987654321"],
    ["(011) 98765-4321", "11987654321"],
  ])("normaliza celular %s para %s", (entrada, esperado) => {
    expect(normalizarTelefone(entrada)).toBe(esperado);
  });

  it.each([
    ["(33) 3521-1234", "3335211234"],
    ["+55 33 3521-1234", "3335211234"],
    ["(033) 3521-1234", "3335211234"],
  ])("normaliza fixo %s para %s", (entrada, esperado) => {
    expect(normalizarTelefone(entrada)).toBe(esperado);
  });

  it.each([
    ["vazio", ""],
    ["sem DDD", "98765-4321"],
    ["dígitos demais", "119876543210"],
    ["DDD começando com zero", "(01) 98765-4321"],
    ["DDD terminando em zero", "(20) 98765-4321"],
    ["celular sem o 9", "(11) 88765-4321"],
    ["fixo começando com 9", "(11) 9876-5432"],
    ["fixo começando com 1", "(11) 1234-5678"],
    ["texto", "não tenho telefone"],
  ])("rejeita %s", (_caso, entrada) => {
    expect(normalizarTelefone(entrada)).toBeNull();
  });
});
