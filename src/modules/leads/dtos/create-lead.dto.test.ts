import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { assertValidCreateLeadDto } from "./create-lead.dto";

const VALID_BODY = {
  nome: "Fulano de Tal",
  email: "Fulano@Exemplo.com",
  whatsapp: "(33) 98462-1004",
  nome_estabelecimento: "Lanchonete do Fulano",
  cpf_cnpj: "123.456.789-00",
};

describe("assertValidCreateLeadDto", () => {
  it("aceita um corpo válido, normaliza e limpa a formatação", () => {
    const dto = assertValidCreateLeadDto(VALID_BODY);

    expect(dto).toEqual({
      nome: "Fulano de Tal",
      email: "fulano@exemplo.com",
      whatsapp: "33984621004",
      nomeEstabelecimento: "Lanchonete do Fulano",
      cpfCnpj: "12345678900",
    });
  });

  it("aceita CNPJ (14 dígitos)", () => {
    const dto = assertValidCreateLeadDto({ ...VALID_BODY, cpf_cnpj: "12.345.678/0001-99" });
    expect(dto.cpfCnpj).toBe("12345678000199");
  });

  it("rejeita nome ausente", () => {
    expect(() => assertValidCreateLeadDto({ ...VALID_BODY, nome: "" })).toThrow(AppError);
  });

  it("rejeita e-mail inválido", () => {
    expect(() => assertValidCreateLeadDto({ ...VALID_BODY, email: "não-é-email" })).toThrow(AppError);
  });

  it("rejeita whatsapp com poucos dígitos", () => {
    expect(() => assertValidCreateLeadDto({ ...VALID_BODY, whatsapp: "123" })).toThrow(AppError);
  });

  it("rejeita cpf_cnpj com quantidade de dígitos inválida", () => {
    expect(() => assertValidCreateLeadDto({ ...VALID_BODY, cpf_cnpj: "123" })).toThrow(AppError);
  });

  it("rejeita nome_estabelecimento ausente", () => {
    expect(() => assertValidCreateLeadDto({ ...VALID_BODY, nome_estabelecimento: "" })).toThrow(AppError);
  });
});
