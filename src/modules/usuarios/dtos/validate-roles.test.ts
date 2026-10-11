import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { UserRole } from "../entities/user.entity";
import { assertValidRoles } from "./validate-roles";

describe("assertValidRoles", () => {
  it.each(Object.values(UserRole))("aceita o papel %s", (role) => {
    expect(assertValidRoles([role])).toEqual([role]);
  });

  it("aceita o papel expedicao sozinho e combinado com outros", () => {
    expect(assertValidRoles(["expedicao"])).toEqual([UserRole.EXPEDICAO]);
    expect(assertValidRoles(["admin", "expedicao"])).toEqual([UserRole.ADMIN, UserRole.EXPEDICAO]);
  });

  it("remove papéis repetidos", () => {
    expect(assertValidRoles(["expedicao", "expedicao"])).toEqual([UserRole.EXPEDICAO]);
  });

  it.each([
    ["lista vazia", []],
    ["não é lista", "expedicao"],
    ["papel inexistente", ["entregador"]],
    ["papel com maiúsculas", ["EXPEDICAO"]],
    ["papel que não é texto", [42]],
  ])("rejeita %s", (_caso, roles) => {
    expect(() => assertValidRoles(roles)).toThrow(AppError);
  });
});
