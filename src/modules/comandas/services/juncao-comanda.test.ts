import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { TipoAtendimento } from "../entities/comanda.entity";
import { assertComandasPodemSerJuntadas } from "./juncao-comanda";

const MESA = { tipoAtendimento: TipoAtendimento.MESA };
const DELIVERY = { tipoAtendimento: TipoAtendimento.DELIVERY };

describe("assertComandasPodemSerJuntadas", () => {
  it("aceita só comandas de mesa", () => {
    expect(() => assertComandasPodemSerJuntadas([MESA, MESA, MESA])).not.toThrow();
  });

  it.each([
    ["principal delivery", [DELIVERY, MESA]],
    ["secundária delivery", [MESA, MESA, DELIVERY]],
  ])("recusa com 400 quando há %s", (_caso, comandas) => {
    expect(() => assertComandasPodemSerJuntadas(comandas)).toThrow(
      expect.objectContaining({ statusCode: 400, message: "Comandas de delivery não podem ser juntadas." })
    );
    expect(() => assertComandasPodemSerJuntadas(comandas)).toThrow(AppError);
  });
});
