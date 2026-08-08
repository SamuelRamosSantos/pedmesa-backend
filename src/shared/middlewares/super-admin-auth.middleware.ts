import { NextFunction, Request, Response } from "express";
import { verifySuperAdminToken } from "../../modules/auth/utils/jwt.util";
import { AppError } from "../errors/app-error";

export function superAdminAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    next(new AppError("Token de autenticação não informado.", 401));
    return;
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const payload = verifySuperAdminToken(token);

    req.superAdmin = { id: payload.sub };

    next();
  } catch {
    next(new AppError("Token inválido ou expirado.", 401));
  }
}
