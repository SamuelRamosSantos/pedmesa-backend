import { describe, expect, it } from "vitest";
import { DescontoTipo } from "../../comandas/entities/comanda.entity";
import { FormaPagamento } from "../../comandas/entities/pagamento-comanda.entity";
import { StatusItem } from "../../pedidos/entities/item-pedido.entity";
import { StatusPreparo } from "../../pedidos/entities/pedido.entity";
import { StatusEntrega } from "../entities/entrega.entity";
import {
  type EntradaDetalheEntrega,
  montarDetalheEntrega,
} from "./detalhe-entrega";

const ENTRADA: EntradaDetalheEntrega = {
  entrega: {
    id: "e1",
    numeroEntrega: 4,
    statusEntrega: StatusEntrega.EM_PRODUCAO,
    versao: 2,
    enderecoCep: "01310100",
    enderecoLogradouro: "Avenida Paulista",
    enderecoNumero: "1000",
    enderecoComplemento: "Apto 52",
    enderecoBairro: "Bela Vista",
    enderecoCidade: "São Paulo",
    enderecoUf: "SP",
    enderecoReferencia: "Portão azul",
    taxaEntrega: 5,
    taxaIsenta: false,
    formaPagamentoPrevista: FormaPagamento.DINHEIRO,
    trocoPara: 100,
    criadoEm: new Date("2026-11-22T20:00:00Z"),
    previsaoEntregaEm: new Date("2026-11-22T20:40:00Z"),
    saiuEm: null,
    entregueEm: null,
    motivoCancelamento: null,
  },
  cliente: { nome: "Maria", telefone: "11987654321" },
  desconto: { tipo: DescontoTipo.NENHUM, valor: 0 },
  itens: [
    {
      id: "i1",
      produto: "Batata Frita",
      quantidade: 2,
      precoUnitario: 19.45,
      observacao: "sem sal",
      statusItem: StatusItem.PENDENTE,
      precisaPreparo: true,
    },
    {
      id: "i2",
      produto: "Cerveja",
      quantidade: 1,
      precoUnitario: 10,
      observacao: null,
      statusItem: StatusItem.PRONTO,
      precisaPreparo: false,
    },
    {
      id: "i3",
      produto: "Refrigerante",
      quantidade: 1,
      precoUnitario: 6,
      observacao: null,
      statusItem: StatusItem.CANCELADO,
      precisaPreparo: false,
    },
  ],
  historico: [],
};

describe("montarDetalheEntrega (PED-130)", () => {
  it("valores sem os itens cancelados: itens + taxa, troco sobre o total", () => {
    const detalhe = montarDetalheEntrega(ENTRADA);

    // 2 × 19,45 + 10 = 48,90; + 5 de taxa = 53,90; troco para 100 = 46,10.
    expect(detalhe.valores).toEqual({
      subtotal: 48.9,
      desconto: 0,
      taxaEntrega: 5,
      taxaIsenta: false,
      total: 53.9,
    });
    expect(detalhe.pagamento).toMatchObject({
      troco: 46.1,
      trocoSuficiente: true,
    });
  });

  it("lista todos os itens (inclusive cancelados) com subtotal de cada um", () => {
    expect(
      montarDetalheEntrega(ENTRADA).itens.map((item) => [
        item.produto,
        item.subtotal,
        item.statusItem,
      ]),
    ).toEqual([
      ["Batata Frita", 38.9, StatusItem.PENDENTE],
      ["Cerveja", 10, StatusItem.PRONTO],
      ["Refrigerante", 6, StatusItem.CANCELADO],
    ]);
  });

  it("status da cozinha só com os itens de preparo, como o card e o KDS", () => {
    expect(montarDetalheEntrega(ENTRADA)).toMatchObject({
      statusPreparo: StatusPreparo.PENDENTE,
      passaPelaCozinha: true,
    });
  });

  it("aplica o desconto da comanda sobre os itens", () => {
    expect(
      montarDetalheEntrega({
        ...ENTRADA,
        desconto: { tipo: DescontoTipo.PERCENTUAL, valor: 10 },
      }).valores,
    ).toMatchObject({ desconto: 4.89, total: 49.01 });
  });
});
