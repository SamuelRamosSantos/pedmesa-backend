import { describe, expect, it } from "vitest";
import { StatusItem } from "../../pedidos/entities/item-pedido.entity";
import { calcularExtrato } from "../../comandas/services/extrato-calculator";
import { itensDoExtratoParaImpressao } from "./itens-do-extrato";

describe("itensDoExtratoParaImpressao", () => {
  it("lista individuais por integrante e depois os compartilhados", () => {
    const calculado = calcularExtrato({
      integrantes: [{ id: "a", nome: "Ana" }],
      itens: [
        { id: "1", produtoNome: "Refri", quantidade: 2, precoUnitario: 6.5, integranteId: null, statusItem: StatusItem.PRONTO },
        { id: "2", produtoNome: "X-Burger", quantidade: 1, precoUnitario: 19.45, integranteId: "a", statusItem: StatusItem.PRONTO },
      ],
    });

    expect(itensDoExtratoParaImpressao(calculado)).toEqual([
      { produto_nome: "X-Burger", quantidade: 1, preco_unitario: 19.45, subtotal: 19.45, integrante_nome: "Ana", observacao: null },
      { produto_nome: "Refri", quantidade: 2, preco_unitario: 6.5, subtotal: 13, integrante_nome: null, observacao: null },
    ]);
  });
});
