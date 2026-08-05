import { describe, expect, it } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { UserRole } from "../entities/user.entity";
import { assertNaoAlteraProprioAcesso } from "./user-access-guard";

describe("assertNaoAlteraProprioAcesso", () => {
  it("não faz nada quando a edição não é sobre o próprio usuário autenticado", () => {
    expect(() =>
      assertNaoAlteraProprioAcesso({
        isSelf: false,
        rolesAtuais: [UserRole.ADMIN],
        novasRoles: [UserRole.CAIXA],
        novoAtivo: false,
      })
    ).not.toThrow();
  });

  it("rejeita quando o próprio admin tenta remover sua permissão de Admin", () => {
    expect(() =>
      assertNaoAlteraProprioAcesso({
        isSelf: true,
        rolesAtuais: [UserRole.ADMIN],
        novasRoles: [UserRole.CAIXA],
      })
    ).toThrow(AppError);
  });

  it("permite o próprio admin manter Admin junto de outras roles", () => {
    expect(() =>
      assertNaoAlteraProprioAcesso({
        isSelf: true,
        rolesAtuais: [UserRole.ADMIN],
        novasRoles: [UserRole.ADMIN, UserRole.CAIXA],
      })
    ).not.toThrow();
  });

  it("rejeita quando o próprio usuário tenta se desativar", () => {
    expect(() =>
      assertNaoAlteraProprioAcesso({
        isSelf: true,
        rolesAtuais: [UserRole.CAIXA],
        novoAtivo: false,
      })
    ).toThrow(AppError);
  });

  it("permite o próprio usuário se manter ativo ou alterar outros campos", () => {
    expect(() =>
      assertNaoAlteraProprioAcesso({
        isSelf: true,
        rolesAtuais: [UserRole.CAIXA],
        novoAtivo: true,
      })
    ).not.toThrow();
  });

  it("não é acionado quando nenhuma role ou status ativo foi enviado na atualização", () => {
    expect(() =>
      assertNaoAlteraProprioAcesso({
        isSelf: true,
        rolesAtuais: [UserRole.ADMIN],
      })
    ).not.toThrow();
  });
});
