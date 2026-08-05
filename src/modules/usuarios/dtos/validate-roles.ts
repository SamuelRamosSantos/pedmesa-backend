import { AppError } from "../../../shared/errors/app-error";
import { UserRole } from "../entities/user.entity";

const ROLES_VALIDAS = Object.values(UserRole);

export function assertValidRoles(roles: unknown): UserRole[] {
  if (!Array.isArray(roles) || roles.length === 0) {
    throw new AppError("Selecione ao menos um papel (visão) para o usuário.", 400);
  }

  const rolesUnicas = [...new Set(roles)];

  rolesUnicas.forEach((role) => {
    if (typeof role !== "string" || !ROLES_VALIDAS.includes(role as UserRole)) {
      throw new AppError(`Papel inválido: ${String(role)}.`, 400);
    }
  });

  return rolesUnicas as UserRole[];
}
