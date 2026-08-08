import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { assertValidUpdateTenantDto } from "./update-tenant.dto";

describe("assertValidUpdateTenantDto", () => {
  it("aceita atualização parcial de um único campo", () => {
    expect(assertValidUpdateTenantDto({ nome_fantasia: "Novo Nome" })).toEqual({ nomeFantasia: "Novo Nome" });
  });

  it("aceita cnpj_cpf e campos legais que o próprio tenant não edita", () => {
    const dto = assertValidUpdateTenantDto({
      cnpj_cpf: "12345678000199",
      razao_social: "Empresa LTDA",
      inscricao_estadual: "123456",
      nome_proprietario: "Fulano",
      cpf_proprietario: "12345678900",
    });

    expect(dto).toEqual({
      cnpjCpf: "12345678000199",
      razaoSocial: "Empresa LTDA",
      inscricaoEstadual: "123456",
      nomeProprietario: "Fulano",
      cpfProprietario: "12345678900",
    });
  });

  it("permite limpar um campo opcional enviando null", () => {
    expect(assertValidUpdateTenantDto({ razao_social: null })).toEqual({ razaoSocial: null });
  });

  it("rejeita nome_fantasia vazio", () => {
    expect(() => assertValidUpdateTenantDto({ nome_fantasia: "  " })).toThrow(AppError);
  });

  it("rejeita cnpj_cpf vazio", () => {
    expect(() => assertValidUpdateTenantDto({ cnpj_cpf: "" })).toThrow(AppError);
  });

  it("rejeita e-mail inválido", () => {
    expect(() => assertValidUpdateTenantDto({ email_empresa: "não-é-email" })).toThrow(AppError);
  });

  it("rejeita estado fora do formato de UF", () => {
    expect(() => assertValidUpdateTenantDto({ estado: "SPX" })).toThrow(AppError);
  });

  it("rejeita corpo vazio", () => {
    expect(() => assertValidUpdateTenantDto({})).toThrow(AppError);
  });
});
