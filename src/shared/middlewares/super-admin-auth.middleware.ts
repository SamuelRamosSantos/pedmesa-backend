import { NextFunction, Request, Response } from "express";
import { verifySuperAdminToken } from "../../modules/auth/utils/jwt.util";
import { AppError } from "../errors/app-error";
import { SUPER_ADMIN_COOKIE_NAME } from "../utils/auth-cookies";

export function superAdminAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[SUPER_ADMIN_COOKIE_NAME];

  if (!token) {
    next(new AppError("Token de autenticação não informado.", 401));
    return;
  }

  try {
    const payload = verifySuperAdminToken(token);

    req.superAdmin = { id: payload.sub };

    next();
  } catch {
    next(new AppError("Token inválido ou expirado.", 401));
  }
}
