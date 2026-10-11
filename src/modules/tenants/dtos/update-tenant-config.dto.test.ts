import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { assertValidUpdateTenantConfigDto } from "./update-tenant-config.dto";

describe("assertValidUpdateTenantConfigDto", () => {
  it("aceita update parcial só com nome_fantasia", () => {
    const dto = assertValidUpdateTenantConfigDto({ nome_fantasia: "Lanchonete Nova" });

    expect(dto).toEqual({ nomeFantasia: "Lanchonete Nova" });
  });

  it("aceita update parcial só com usa_modulo_cozinha", () => {
    const dto = assertValidUpdateTenantConfigDto({ usa_modulo_cozinha: false });

    expect(dto).toEqual({ usaModuloCozinha: false });
  });

  it("aceita todos os campos de uma vez, incluindo endereço", () => {
    const dto = assertValidUpdateTenantConfigDto({
      nome_fantasia: "Lanchonete Nova",
      ramo_atividade: "Alimentação",
      email_empresa: "contato@lanchonete.com",
      email_proprietario: "dono@lanchonete.com",
      usa_modulo_cozinha: true,
      quantidade_comandas: 30,
      logradouro: "Rua das Flores",
      numero: "123",
      bairro: "Centro",
      cidade: "Curitiba",
      estado: "pr",
      cep: "80000-000",
    });

    expect(dto).toEqual({
      nomeFantasia: "Lanchonete Nova",
      ramoAtividade: "Alimentação",
      emailEmpresa: "contato@lanchonete.com",
      emailProprietario: "dono@lanchonete.com",
      usaModuloCozinha: true,
      quantidadeComandas: 30,
      logradouro: "Rua das Flores",
      numero: "123",
      bairro: "Centro",
      cidade: "Curitiba",
      estado: "PR",
      cep: "80000-000",
    });
  });

  it("aceita ramo_atividade, e-mails e campos de endereço como null para limpar o campo", () => {
    const dto = assertValidUpdateTenantConfigDto({
      ramo_atividade: null,
      email_empresa: null,
      email_proprietario: null,
      logradouro: null,
      numero: null,
      bairro: null,
      cidade: null,
      estado: null,
      cep: null,
    });

    expect(dto).toEqual({
      ramoAtividade: null,
      emailEmpresa: null,
      emailProprietario: null,
      logradouro: null,
      numero: null,
      bairro: null,
      cidade: null,
      estado: null,
      cep: null,
    });
  });

  it("rejeita corpo vazio", () => {
    expect(() => assertValidUpdateTenantConfigDto({})).toThrow(AppError);
  });

  it("rejeita nome_fantasia vazio", () => {
    expect(() => assertValidUpdateTenantConfigDto({ nome_fantasia: "   " })).toThrow(AppError);
  });

  it("rejeita e-mail inválido", () => {
    expect(() => assertValidUpdateTenantConfigDto({ email_empresa: "nao-e-email" })).toThrow(AppError);
    expect(() => assertValidUpdateTenantConfigDto({ email_proprietario: "nao-e-email" })).toThrow(AppError);
  });

  it("rejeita usa_modulo_cozinha não booleano", () => {
    expect(() => assertValidUpdateTenantConfigDto({ usa_modulo_cozinha: "sim" })).toThrow(AppError);
  });

  it("rejeita quantidade_comandas não positiva", () => {
    expect(() => assertValidUpdateTenantConfigDto({ quantidade_comandas: 0 })).toThrow(AppError);
    expect(() => assertValidUpdateTenantConfigDto({ quantidade_comandas: -5 })).toThrow(AppError);
    expect(() => assertValidUpdateTenantConfigDto({ quantidade_comandas: 1.5 })).toThrow(AppError);
  });

  it("rejeita estado que não seja uma sigla de UF de 2 letras", () => {
    expect(() => assertValidUpdateTenantConfigDto({ estado: "Paraná" })).toThrow(AppError);
    expect(() => assertValidUpdateTenantConfigDto({ estado: "P" })).toThrow(AppError);
    expect(() => assertValidUpdateTenantConfigDto({ estado: 123 })).toThrow(AppError);
  });

  describe("configuração de delivery (PED-91)", () => {
    it("aceita os três campos de delivery", () => {
      expect(
        assertValidUpdateTenantConfigDto({ delivery_ativo: true, taxa_entrega_padrao: 8.5, pedido_minimo_delivery: 30 })
      ).toEqual({ deliveryAtivo: true, taxaEntregaPadrao: 8.5, pedidoMinimoDelivery: 30 });
    });

    it("taxa_entrega_padrao: null significa não atender bairros fora da lista", () => {
      expect(assertValidUpdateTenantConfigDto({ taxa_entrega_padrao: null })).toEqual({ taxaEntregaPadrao: null });
    });

    it("aceita zero (frete grátis e sem pedido mínimo)", () => {
      expect(assertValidUpdateTenantConfigDto({ taxa_entrega_padrao: 0, pedido_minimo_delivery: 0 })).toEqual({
        taxaEntregaPadrao: 0,
        pedidoMinimoDelivery: 0,
      });
    });

    it.each([
      ["delivery_ativo como texto", { delivery_ativo: "true" }],
      ["taxa padrão negativa", { taxa_entrega_padrao: -1 }],
      ["taxa padrão com 3 casas decimais", { taxa_entrega_padrao: 5.555 }],
      ["pedido mínimo null", { pedido_minimo_delivery: null }],
      ["pedido mínimo negativo", { pedido_minimo_delivery: -10 }],
      ["pedido mínimo como texto", { pedido_minimo_delivery: "30" }],
    ])("rejeita %s", (_caso, body) => {
      expect(() => assertValidUpdateTenantConfigDto(body)).toThrow(AppError);
    });
  });
});
