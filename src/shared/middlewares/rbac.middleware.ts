import { NextFunction, Request, Response } from "express";
import { UserRole } from "../../modules/usuarios/entities/user.entity";
import { AppError } from "../errors/app-error";

export function rbacMiddleware(rolesPermitidas: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.roles.some((role) => rolesPermitidas.includes(role))) {
      next(new AppError("Você não tem permissão para acessar este recurso.", 403));
      return;
    }

    next();
  };
}
