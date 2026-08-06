import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../../modules/auth/utils/jwt.util";
import { AppError } from "../errors/app-error";

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    next(new AppError("Token de autenticação não informado.", 401));
    return;
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const payload = verifyToken(token);

    req.user = {
      id: payload.sub,
      tenantId: payload.tenant_id,
      roles: payload.roles,
      podeExcluirItemFechamento: payload.pode_excluir_item_fechamento,
      podeConcederDesconto: payload.pode_conceder_desconto,
    };
    req.tenantId = payload.tenant_id;

    next();
  } catch {
    next(new AppError("Token inválido ou expirado.", 401));
  }
}
