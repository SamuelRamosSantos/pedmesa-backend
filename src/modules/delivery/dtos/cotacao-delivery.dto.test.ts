import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { FormaPagamento } from "../../comandas/entities/pagamento-comanda.entity";
import { assertValidCotacaoDeliveryDto } from "./cotacao-delivery.dto";

const PRODUTO = "3f1c2a4e-5b6d-4e7f-8a9b-0c1d2e3f4a5b";
const VALID_BODY = {
  endereco: { cidade: " São Paulo ", bairro: "Bela Vista", cep: "01310100" },
  itens: [{ produto_id: PRODUTO, quantidade: 2 }],
  forma_pagamento: "dinheiro",
  troco_para: 50,
};

describe("assertValidCotacaoDeliveryDto", () => {
  it("aceita uma cotação válida e converte troco_para para centavos", () => {
    expect(assertValidCotacaoDeliveryDto(VALID_BODY)).toEqual({
      endereco: { cidade: "São Paulo", bairro: "Bela Vista" },
      itens: [{ produtoId: PRODUTO, integranteId: null, quantidade: 2, observacao: null }],
      formaPagamento: FormaPagamento.DINHEIRO,
      trocoParaCents: 5_000,
    });
  });

  it("troco_para ausente ou null vira null", () => {
    expect(assertValidCotacaoDeliveryDto({ ...VALID_BODY, troco_para: undefined }).trocoParaCents).toBeNull();
    expect(assertValidCotacaoDeliveryDto({ ...VALID_BODY, troco_para: null }).trocoParaCents).toBeNull();
  });

  it("ignora taxa_entrega e total enviados pelo cliente", () => {
    const dto = assertValidCotacaoDeliveryDto({ ...VALID_BODY, taxa_entrega: 0, total: 1 });
    expect(dto).not.toHaveProperty("taxa_entrega");
    expect(dto).not.toHaveProperty("total");
  });

  it.each([
    ["sem endereço", { endereco: undefined }],
    ["endereço sem bairro", { endereco: { cidade: "São Paulo" } }],
    ["sem itens", { itens: [] }],
    ["item com produto_id inválido", { itens: [{ produto_id: "x", quantidade: 1 }] }],
    ["quantidade zero", { itens: [{ produto_id: PRODUTO, quantidade: 0 }] }],
    ["forma de pagamento inválida", { forma_pagamento: "boleto" }],
    ["troco_para negativo", { troco_para: -1 }],
    ["troco_para com 3 casas", { troco_para: 50.005 }],
  ])("rejeita %s", (_caso, alteracao) => {
    expect(() => assertValidCotacaoDeliveryDto({ ...VALID_BODY, ...alteracao })).toThrow(AppError);
  });
});
