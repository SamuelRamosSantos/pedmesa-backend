import { describe, expect, it } from "vitest";
import { FormaPagamento } from "../../comandas/entities/pagamento-comanda.entity";
import { calcularExtrato } from "../../comandas/services/extrato-calculator";
import { StatusItem } from "../../pedidos/entities/item-pedido.entity";
import { EntregaParaTicket, montarJobEntrega } from "./ticket-entrega";

const ENTREGA: EntregaParaTicket = {
  tenantId: "t",
  comandaId: "c",
  numeroEntrega: 7,
  enderecoCep: "01310100",
  enderecoLogradouro: "Av. Paulista",
  enderecoNumero: "1000",
  enderecoComplemento: null,
  enderecoBairro: "Bela Vista",
  enderecoCidade: "São Paulo",
  enderecoUf: "SP",
  enderecoReferencia: "Portão azul",
  formaPagamentoPrevista: FormaPagamento.DINHEIRO,
  trocoPara: 50,
};

const extrato = (quantidade: number) =>
  calcularExtrato({
    integrantes: [{ id: "c1", nome: "Maria" }],
    itens: [{ id: "i", produtoNome: "X-Burger", quantidade, precoUnitario: 19.45, integranteId: "c1", statusItem: StatusItem.PRONTO }],
    taxaEntrega: 7.5,
  });

describe("montarJobEntrega", () => {
  it("usa o extrato atual: itens, subtotal, taxa, total e troco recalculado", () => {
    const job = montarJobEntrega(ENTREGA, { nome: "Maria", telefone: "11987654321" }, extrato(2), new Date("2026-10-10T15:00:00Z"));

    expect(job.numero_entrega).toBe(7);
    expect(job.itens).toEqual([
      { produto_nome: "X-Burger", quantidade: 2, preco_unitario: 19.45, subtotal: 38.9, integrante_nome: "Maria", observacao: null },
    ]);
    expect(job.dados).toMatchObject({
      cliente_nome: "Maria",
      cliente_telefone: "11987654321",
      subtotal: 38.9,
      taxa_entrega: 7.5,
      total: 46.4,
      forma_pagamento: "dinheiro",
      troco_para: 50,
      troco: 3.6,
    });
    expect(job.dados.endereco).toMatchObject({ bairro: "Bela Vista", referencia: "Portão azul" });
  });

  it("se os itens cresceram e o troco não cobre mais, sai com troco 0 (não quebra)", () => {
    const job = montarJobEntrega(ENTREGA, { nome: "Maria", telefone: "11987654321" }, extrato(3), new Date());

    expect(job.dados.total).toBe(65.85);
    expect(job.dados.troco).toBe(0);
  });
});
