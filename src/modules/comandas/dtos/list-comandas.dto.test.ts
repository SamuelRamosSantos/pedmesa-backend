import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { ComandaStatus, TipoAtendimento } from "../entities/comanda.entity";
import { parseListComandasFilters } from "./list-comandas.dto";

describe("parseListComandasFilters", () => {
  it("sem parâmetros: comandas abertas de mesa", () => {
    expect(parseListComandasFilters({})).toEqual({ status: ComandaStatus.ABERTA, tipoAtendimento: TipoAtendimento.MESA });
  });

  it("aceita tipo delivery e status fechada", () => {
    expect(parseListComandasFilters({ status: "fechada", tipo: "delivery" })).toEqual({
      status: ComandaStatus.FECHADA,
      tipoAtendimento: TipoAtendimento.DELIVERY,
    });
  });

  it.each([
    ["status inválido", { status: "cancelada" }],
    ["tipo inválido", { tipo: "balcao" }],
    ["tipo repetido na query", { tipo: ["mesa", "delivery"] }],
  ])("rejeita %s", (_caso, query) => {
    expect(() => parseListComandasFilters(query)).toThrow(AppError);
  });
});
