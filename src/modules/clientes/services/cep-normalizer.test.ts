import { describe, expect, it } from "vitest";
import { normalizarCep } from "./cep-normalizer";

describe("normalizarCep", () => {
  it.each([
    ["01310-100", "01310100"],
    ["01310100", "01310100"],
    ["01.310-100", "01310100"],
    [" 01310 100 ", "01310100"],
  ])("normaliza %s para %s", (entrada, esperado) => {
    expect(normalizarCep(entrada)).toBe(esperado);
  });

  it.each([
    ["vazio", ""],
    ["7 dígitos", "1310-100"],
    ["9 dígitos", "01310-1000"],
    ["letra no lugar de zero", "01310-1O0"],
    ["texto antes dos dígitos", "cep 01310100"],
  ])("rejeita %s", (_caso, entrada) => {
    expect(normalizarCep(entrada)).toBeNull();
  });
});
