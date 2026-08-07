import { describe, expect, it } from "vitest";
import { construirComandosEscPos } from "./escpos-commands";

describe("construirComandosEscPos", () => {
  it("inicia com ESC @ (0x1B 0x40)", () => {
    const comandos = construirComandosEscPos("teste");

    expect(comandos[0]).toBe(0x1b);
    expect(comandos[1]).toBe(0x40);
  });

  it("termina com o comando de corte total GS V 0 (0x1D 0x56 0x00)", () => {
    const comandos = construirComandosEscPos("teste");
    const tamanho = comandos.length;

    expect(comandos[tamanho - 3]).toBe(0x1d);
    expect(comandos[tamanho - 2]).toBe(0x56);
    expect(comandos[tamanho - 1]).toBe(0x00);
  });

  it("inclui o texto informado entre a inicialização e o corte", () => {
    const comandos = construirComandosEscPos("ABC");
    const texto = comandos.toString("latin1");

    expect(texto).toContain("ABC");
  });

  it("preserva acentuação em latin1", () => {
    const comandos = construirComandosEscPos("Ração à moda");
    const texto = comandos.toString("latin1");

    expect(texto).toContain("Ração à moda");
  });
});
