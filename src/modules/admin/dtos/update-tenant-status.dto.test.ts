import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { TenantStatus } from "../../tenants/entities/tenant.entity";
import { assertValidUpdateTenantStatusDto } from "./update-tenant-status.dto";

describe("assertValidUpdateTenantStatusDto", () => {
  it("aceita cada status válido", () => {
    expect(assertValidUpdateTenantStatusDto({ status: "ativo" })).toEqual({ status: TenantStatus.ATIVO });
    expect(assertValidUpdateTenantStatusDto({ status: "suspenso" })).toEqual({ status: TenantStatus.SUSPENSO });
    expect(assertValidUpdateTenantStatusDto({ status: "cancelado" })).toEqual({ status: TenantStatus.CANCELADO });
  });

  it("rejeita status inválido", () => {
    expect(() => assertValidUpdateTenantStatusDto({ status: "pausado" })).toThrow(AppError);
  });

  it("rejeita status ausente", () => {
    expect(() => assertValidUpdateTenantStatusDto({})).toThrow(AppError);
  });
});
