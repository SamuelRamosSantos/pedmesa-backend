import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { FormaPagamento } from "../../comandas/entities/pagamento-comanda.entity";
import { assertValidCriarPedidoDeliveryDto } from "./criar-pedido-delivery.dto";

const PRODUTO = "3f1c2a4e-5b6d-4e7f-8a9b-0c1d2e3f4a5b";
const ENDERECO_ID = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";
const ENDERECO = { cep: "01310-100", logradouro: "Av. Paulista", numero: "1000", bairro: "Bela Vista", cidade: "São Paulo", uf: "sp" };
const BASE = {
  cliente: { nome: "Maria", telefone: "(11) 98765-4321" },
  endereco: ENDERECO,
  itens: [{ produto_id: PRODUTO, quantidade: 2, observacao: "sem cebola" }],
  forma_pagamento: "dinheiro",
  troco_para: 50,
};

describe("assertValidCriarPedidoDeliveryDto", () => {
  it("aceita endereço novo, normaliza cliente/endereço e converte troco para centavos", () => {
    expect(assertValidCriarPedidoDeliveryDto({ ...BASE, salvar_endereco: true })).toEqual({
      cliente: { nome: "Maria", telefone: "11987654321", observacoes: null },
      endereco: {
        tipo: "novo",
        salvarNoCadastro: true,
        endereco: {
          cep: "01310100",
          logradouro: "Av. Paulista",
          numero: "1000",
          complemento: null,
          bairro: "Bela Vista",
          cidade: "São Paulo",
          uf: "SP",
          referencia: null,
        },
      },
      itens: [{ produtoId: PRODUTO, integranteId: null, quantidade: 2, observacao: "sem cebola" }],
      formaPagamento: FormaPagamento.DINHEIRO,
      trocoParaCents: 5_000,
    });
  });

  it("salvar_endereco ausente vira false", () => {
    const dto = assertValidCriarPedidoDeliveryDto(BASE);
    expect(dto.endereco).toMatchObject({ tipo: "novo", salvarNoCadastro: false });
  });

  it("aceita endereço salvo pelo id", () => {
    const { endereco: _e, ...semEndereco } = BASE;
    expect(assertValidCriarPedidoDeliveryDto({ ...semEndereco, endereco_id: ENDERECO_ID }).endereco).toEqual({
      tipo: "salvo",
      enderecoId: ENDERECO_ID,
    });
  });

  it("ignora integrante_id, taxa_entrega, total e tenant_id do corpo", () => {
    const dto = assertValidCriarPedidoDeliveryDto({
      ...BASE,
      itens: [{ produto_id: PRODUTO, quantidade: 1, integrante_id: ENDERECO_ID }],
      taxa_entrega: 0,
      total: 1,
      tenant_id: "x",
    });
    expect(dto.itens[0].integranteId).toBeNull();
    expect(dto).not.toHaveProperty("taxa_entrega");
    expect(dto).not.toHaveProperty("tenant_id");
  });

  it.each([
    ["sem cliente", { cliente: undefined }],
    ["telefone inválido", { cliente: { nome: "Maria", telefone: "123" } }],
    ["endereço e endereco_id juntos", { endereco_id: ENDERECO_ID }],
    ["endereco_id inválido", { endereco: undefined, endereco_id: "x" }],
    ["sem endereço nenhum", { endereco: undefined }],
    ["endereço sem bairro", { endereco: { ...ENDERECO, bairro: undefined } }],
    ["salvar_endereco como texto", { salvar_endereco: "sim" }],
    ["sem itens", { itens: [] }],
    ["forma de pagamento inválida", { forma_pagamento: "boleto" }],
    ["troco negativo", { troco_para: -5 }],
  ])("rejeita %s", (_caso, alteracao) => {
    expect(() => assertValidCriarPedidoDeliveryDto({ ...BASE, ...alteracao })).toThrow(AppError);
  });
});
