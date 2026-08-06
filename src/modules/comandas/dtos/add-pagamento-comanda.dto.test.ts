import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { FormaPagamento } from "../entities/pagamento-comanda.entity";
import { assertValidAddPagamentoComandaDto } from "./add-pagamento-comanda.dto";

describe("assertValidAddPagamentoComandaDto", () => {
  it("aceita um pagamento válido", () => {
    const dto = assertValidAddPagamentoComandaDto({ forma: "pix", valor: 50 });

    expect(dto).toEqual({ forma: FormaPagamento.PIX, valor: 50 });
  });

  it("rejeita forma inválida", () => {
    expect(() => assertValidAddPagamentoComandaDto({ forma: "boleto", valor: 10 })).toThrow(AppError);
  });

  it("rejeita forma ausente", () => {
    expect(() => assertValidAddPagamentoComandaDto({ valor: 10 })).toThrow(AppError);
  });

  it("rejeita valor não positivo", () => {
    expect(() => assertValidAddPagamentoComandaDto({ forma: "dinheiro", valor: 0 })).toThrow(AppError);
    expect(() => assertValidAddPagamentoComandaDto({ forma: "dinheiro", valor: -10 })).toThrow(AppError);
  });

  it("rejeita valor não numérico", () => {
    expect(() => assertValidAddPagamentoComandaDto({ forma: "pix", valor: "50" })).toThrow(AppError);
  });
});
