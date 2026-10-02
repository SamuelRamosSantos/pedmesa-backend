import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { exigirNumeroDaMesa } from "./numero-comanda";

describe("exigirNumeroDaMesa", () => {
  it("devolve o número quando a comanda é de mesa", () => {
    expect(exigirNumeroDaMesa(12)).toBe(12);
  });

  it("recusa comanda sem número (delivery) com AppError 400", () => {
    expect(() => exigirNumeroDaMesa(null)).toThrow(AppError);
    expect(() => exigirNumeroDaMesa(null)).toThrow(
      expect.objectContaining({
        statusCode: 400,
        message: "Esta operação ainda não está disponível para pedidos de delivery.",
      })
    );
  });
});
