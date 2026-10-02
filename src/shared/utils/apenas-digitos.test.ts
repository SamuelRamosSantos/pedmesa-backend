import { describe, expect, it } from "vitest";
import { apenasDigitos } from "./apenas-digitos";

describe("apenasDigitos", () => {
  it("remove máscara, espaços e sinais", () => {
    expect(apenasDigitos("+55 (11) 98765-4321")).toBe("5511987654321");
  });

  it("devolve string vazia quando não há dígitos", () => {
    expect(apenasDigitos("abc")).toBe("");
  });
});
