import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { assertValidCreateTenantDto } from "./create-tenant.dto";

const VALID_BODY = {
  nome_fantasia: "Lanchonete Nova",
  cnpj_cpf: "12345678000199",
  admin_nome: "Fulano",
  admin_email: "Fulano@Exemplo.com",
  admin_senha: "senha123",
};

describe("assertValidCreateTenantDto", () => {
  it("aceita um corpo válido e normaliza nome/e-mail", () => {
    const dto = assertValidCreateTenantDto(VALID_BODY);

    expect(dto).toEqual({
      nomeFantasia: "Lanchonete Nova",
      cnpjCpf: "12345678000199",
      adminNome: "Fulano",
      adminEmail: "fulano@exemplo.com",
      adminSenha: "senha123",
    });
  });

  it("rejeita nome_fantasia ausente ou vazio", () => {
    expect(() => assertValidCreateTenantDto({ ...VALID_BODY, nome_fantasia: "" })).toThrow(AppError);
    expect(() => assertValidCreateTenantDto({ ...VALID_BODY, nome_fantasia: undefined })).toThrow(AppError);
  });

  it("rejeita cnpj_cpf ausente", () => {
    expect(() => assertValidCreateTenantDto({ ...VALID_BODY, cnpj_cpf: "" })).toThrow(AppError);
  });

  it("rejeita e-mail do administrador inválido", () => {
    expect(() => assertValidCreateTenantDto({ ...VALID_BODY, admin_email: "não-é-email" })).toThrow(AppError);
  });

  it("rejeita senha do administrador curta demais", () => {
    expect(() => assertValidCreateTenantDto({ ...VALID_BODY, admin_senha: "123" })).toThrow(AppError);
  });
});
