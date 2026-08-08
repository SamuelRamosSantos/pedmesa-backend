import { NextFunction, Request, Response } from "express";
import { AuditLogService } from "../../modules/admin/services/audit-log.service";
import { verifyToken } from "../../modules/auth/utils/jwt.util";
import { AppError } from "../errors/app-error";

const METODOS_DE_ESCRITA = new Set(["POST", "PATCH", "PUT", "DELETE"]);

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
      impersonatedBy: payload.impersonated_by ?? null,
    };
    req.tenantId = payload.tenant_id;

    // PED-41: toda ação de escrita feita durante uma sessão de impersonation
    // fica registrada em audit_logs. Disparado sem await de propósito — uma
    // falha ao gravar o log não pode derrubar a ação real do usuário.
    if (payload.impersonated_by && METODOS_DE_ESCRITA.has(req.method)) {
      AuditLogService.registrar({
        superAdminId: payload.impersonated_by,
        tenantId: payload.tenant_id,
        usuarioId: payload.sub,
        metodo: req.method,
        rota: req.originalUrl,
      }).catch((error) => {
        console.error("[AUDIT LOG] Falha ao registrar ação durante impersonation:", error);
      });
    }

    next();
  } catch {
    next(new AppError("Token inválido ou expirado.", 401));
  }
}
