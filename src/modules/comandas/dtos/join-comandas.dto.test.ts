import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { assertValidJoinComandasDto } from "./join-comandas.dto";

const PRINCIPAL_ID = "11111111-1111-1111-1111-111111111111";
const SECUNDARIA_1_ID = "22222222-2222-2222-2222-222222222222";
const SECUNDARIA_2_ID = "33333333-3333-3333-3333-333333333333";

describe("assertValidJoinComandasDto", () => {
  it("aceita um corpo válido e mapeia para camelCase", () => {
    const dto = assertValidJoinComandasDto({
      comanda_principal_id: PRINCIPAL_ID,
      comandas_secundarias_ids: [SECUNDARIA_1_ID, SECUNDARIA_2_ID],
    });

    expect(dto).toEqual({
      comandaPrincipalId: PRINCIPAL_ID,
      comandasSecundariasIds: [SECUNDARIA_1_ID, SECUNDARIA_2_ID],
    });
  });

  it("remove IDs secundários duplicados sem lançar erro", () => {
    const dto = assertValidJoinComandasDto({
      comanda_principal_id: PRINCIPAL_ID,
      comandas_secundarias_ids: [SECUNDARIA_1_ID, SECUNDARIA_1_ID, SECUNDARIA_2_ID],
    });

    expect(dto.comandasSecundariasIds).toEqual([SECUNDARIA_1_ID, SECUNDARIA_2_ID]);
  });

  it("rejeita comanda_principal_id ausente ou inválido", () => {
    expect(() =>
      assertValidJoinComandasDto({ comandas_secundarias_ids: [SECUNDARIA_1_ID] })
    ).toThrow(AppError);

    expect(() =>
      assertValidJoinComandasDto({ comanda_principal_id: "nao-e-uuid", comandas_secundarias_ids: [SECUNDARIA_1_ID] })
    ).toThrow(AppError);
  });

  it("rejeita lista de secundárias vazia ou ausente", () => {
    expect(() =>
      assertValidJoinComandasDto({ comanda_principal_id: PRINCIPAL_ID, comandas_secundarias_ids: [] })
    ).toThrow(AppError);

    expect(() => assertValidJoinComandasDto({ comanda_principal_id: PRINCIPAL_ID })).toThrow(AppError);
  });

  it("rejeita um ID inválido dentro da lista de secundárias", () => {
    expect(() =>
      assertValidJoinComandasDto({
        comanda_principal_id: PRINCIPAL_ID,
        comandas_secundarias_ids: [SECUNDARIA_1_ID, "nao-e-uuid"],
      })
    ).toThrow(AppError);
  });

  it("rejeita quando a comanda principal também aparece na lista de secundárias (auto-junção)", () => {
    expect(() =>
      assertValidJoinComandasDto({
        comanda_principal_id: PRINCIPAL_ID,
        comandas_secundarias_ids: [SECUNDARIA_1_ID, PRINCIPAL_ID],
      })
    ).toThrow(AppError);
  });

  it("todos os erros de validação resultam em status HTTP 400", () => {
    try {
      assertValidJoinComandasDto({});
      expect.unreachable("deveria ter lançado AppError");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).statusCode).toBe(400);
    }
  });
});
