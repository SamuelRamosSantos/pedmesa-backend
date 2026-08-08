import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { TenantStatus } from "../../tenants/entities/tenant.entity";
import { parseListTenantsFilters } from "./list-tenants.dto";

describe("parseListTenantsFilters", () => {
  it("retorna filtros nulos quando nada é informado", () => {
    expect(parseListTenantsFilters({})).toEqual({ status: null, nome: null });
  });

  it("aceita um status válido", () => {
    expect(parseListTenantsFilters({ status: "suspenso" })).toEqual({ status: TenantStatus.SUSPENSO, nome: null });
  });

  it("rejeita um status inválido", () => {
    expect(() => parseListTenantsFilters({ status: "pausado" })).toThrow(AppError);
  });

  it("aceita e normaliza (trim) o filtro de nome", () => {
    expect(parseListTenantsFilters({ nome: "  Lanchonete  " })).toEqual({ status: null, nome: "Lanchonete" });
  });

  it("ignora nome em branco", () => {
    expect(parseListTenantsFilters({ nome: "   " })).toEqual({ status: null, nome: null });
  });
});
