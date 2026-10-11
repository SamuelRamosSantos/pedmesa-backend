import { describe, expect, it } from "vitest";
import { EntregaJobPayload } from "../types/print-job.types";
import { formatarEntrega } from "./entrega.formatter";

const JOB_ENTREGA_EXEMPLO: EntregaJobPayload = {
  tenant_id: "t",
  comanda_id: "c",
  numero_entrega: 7,
  gerado_em: new Date("2026-10-10T15:30:00Z"),
  itens: [
    { produto_nome: "X-Burger", quantidade: 2, preco_unitario: 19.45, subtotal: 38.9, integrante_nome: "Maria", observacao: "sem cebola" },
  ],
  dados: {
    cliente_nome: "Maria Souza",
    cliente_telefone: "11987654321",
    endereco: {
      cep: "01310100",
      logradouro: "Avenida Paulista",
      numero: "1000",
      complemento: "Apto 52",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      uf: "SP",
      referencia: "Próximo ao MASP",
    },
    subtotal: 38.9,
    taxa_entrega: 7.5,
    total: 46.4,
    forma_pagamento: "dinheiro",
    troco_para: 50,
    troco: 3.6,
  },
};

describe("formatarEntrega", () => {
  it("monta o cupom do motoboy com número, cliente, endereço, itens, valores e troco", () => {
    expect(formatarEntrega(JOB_ENTREGA_EXEMPLO)).toBe(
      [
        "[ESC/POS] INIT",
        "================================",
        "       ENTREGA - DELIVERY      ",
        "================================",
        "DELIVERY #0007",
        "Emitido em: 10/10/2026, 12:30:00",
        "--------------------------------",
        "Cliente: Maria Souza",
        "Tel: (11) 98765-4321",
        "--------------------------------",
        "ENDEREÇO",
        "Avenida Paulista, 1000 - Apto 52",
        "Bela Vista - São Paulo/SP",
        "CEP 01310-100",
        "Ref.: Próximo ao MASP",
        "--------------------------------",
        "2x X-Burger - R$ 38,90",
        "  Obs: sem cebola",
        "--------------------------------",
        "Subtotal: R$ 38,90",
        "Taxa de entrega: R$ 7,50",
        "TOTAL: R$ 46,40",
        "--------------------------------",
        "Pagamento: Dinheiro",
        "Troco para: R$ 50,00",
        "LEVAR TROCO: R$ 3,60",
        "================================",
        "[ESC/POS] CUT",
      ].join("\n")
    );
  });

  it("sem troco (PIX): não imprime as linhas de troco", () => {
    const texto = formatarEntrega({ ...JOB_ENTREGA_EXEMPLO, dados: { ...JOB_ENTREGA_EXEMPLO.dados, forma_pagamento: "pix", troco_para: null, troco: 0 } });

    expect(texto).toContain("Pagamento: PIX");
    expect(texto).not.toContain("TROCO");
  });

  it("sem complemento nem referência: omite as partes vazias", () => {
    const texto = formatarEntrega({
      ...JOB_ENTREGA_EXEMPLO,
      dados: { ...JOB_ENTREGA_EXEMPLO.dados, endereco: { ...JOB_ENTREGA_EXEMPLO.dados.endereco, complemento: null, referencia: null } },
    });

    expect(texto).toContain("Avenida Paulista, 1000\n");
    expect(texto).not.toContain("Ref.:");
  });
});
