import { describe, expect, it } from "vitest";
import { TipoAtendimento } from "../../comandas/entities/comanda.entity";
import { identificadorDoAtendimento } from "./identificador-atendimento";

describe("identificadorDoAtendimento", () => {
  it("mesa usa o número da comanda", () => {
    expect(identificadorDoAtendimento(TipoAtendimento.MESA, 12, null)).toBe("Mesa 12");
  });

  it("delivery usa o número da entrega, sem zeros à esquerda", () => {
    expect(identificadorDoAtendimento(TipoAtendimento.DELIVERY, null, 7)).toBe("Delivery #7");
  });

  it("sem número não imprime null", () => {
    expect(identificadorDoAtendimento(TipoAtendimento.MESA, null, null)).toBe("Mesa");
    expect(identificadorDoAtendimento(TipoAtendimento.DELIVERY, null, null)).toBe("Delivery");
  });
});
