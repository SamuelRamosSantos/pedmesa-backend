import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { DescontoTipo } from "../entities/comanda.entity";
import { assertValidFecharComandaDto } from "./fechar-comanda.dto";

describe("assertValidFecharComandaDto", () => {
  it("aceita um fechamento sem desconto (padrão nenhum)", () => {
    const dto = assertValidFecharComandaDto({});

    expect(dto).toEqual({ descontoTipo: DescontoTipo.NENHUM, descontoValor: 0 });
  });

  it("aceita desconto percentual válido", () => {
    const dto = assertValidFecharComandaDto({ desconto_tipo: "percentual", desconto_valor: 10 });

    expect(dto.descontoTipo).toBe(DescontoTipo.PERCENTUAL);
    expect(dto.descontoValor).toBe(10);
  });

  it("aceita desconto em valor fixo válido", () => {
    const dto = assertValidFecharComandaDto({ desconto_tipo: "valor_fixo", desconto_valor: 20 });

    expect(dto.descontoTipo).toBe(DescontoTipo.VALOR_FIXO);
    expect(dto.descontoValor).toBe(20);
  });

  it("rejeita desconto_tipo inválido", () => {
    expect(() => assertValidFecharComandaDto({ desconto_tipo: "cupom", desconto_valor: 10 })).toThrow(AppError);
  });

  it("rejeita desconto_valor negativo", () => {
    expect(() => assertValidFecharComandaDto({ desconto_tipo: "valor_fixo", desconto_valor: -5 })).toThrow(AppError);
  });

  it("rejeita desconto percentual maior que 100", () => {
    expect(() => assertValidFecharComandaDto({ desconto_tipo: "percentual", desconto_valor: 150 })).toThrow(AppError);
  });

  it("rejeita desconto_tipo diferente de nenhum sem informar um valor maior que zero", () => {
    expect(() => assertValidFecharComandaDto({ desconto_tipo: "percentual" })).toThrow(AppError);
  });
});
