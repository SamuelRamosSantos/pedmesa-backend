import { AppError } from "../../../shared/errors/app-error";
import { UserRole } from "../entities/user.entity";

interface AssertNaoAlteraProprioAcessoParams {
  isSelf: boolean;
  rolesAtuais: UserRole[];
  novasRoles?: UserRole[];
  novoAtivo?: boolean;
}

export function assertNaoAlteraProprioAcesso(params: AssertNaoAlteraProprioAcessoParams): void {
  if (!params.isSelf) {
    return;
  }

  if (params.novasRoles && params.rolesAtuais.includes(UserRole.ADMIN) && !params.novasRoles.includes(UserRole.ADMIN)) {
    throw new AppError("Você não pode remover sua própria permissão de Admin.", 400);
  }

  if (params.novoAtivo === false) {
    throw new AppError("Você não pode desativar sua própria conta.", 400);
  }
}
