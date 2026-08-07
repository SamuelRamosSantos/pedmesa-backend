import { Router } from "express";
import { agentAuthMiddleware } from "../../../shared/middlewares/agent-auth.middleware";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { rbacMiddleware } from "../../../shared/middlewares/rbac.middleware";
import { UserRole } from "../../usuarios/entities/user.entity";
import { listPendentes, updateStatus } from "../controllers/fila-impressao.controller";
import { create, list, remove, update } from "../controllers/impressora.controller";

const impressaoRoutes = Router();

const ALLOWED_ROLES = [UserRole.ADMIN];

impressaoRoutes.get("/impressoras", authMiddleware, rbacMiddleware(ALLOWED_ROLES), list);
impressaoRoutes.post("/impressoras", authMiddleware, rbacMiddleware(ALLOWED_ROLES), create);
impressaoRoutes.patch("/impressoras/:id", authMiddleware, rbacMiddleware(ALLOWED_ROLES), update);
impressaoRoutes.delete("/impressoras/:id", authMiddleware, rbacMiddleware(ALLOWED_ROLES), remove);

// Rotas de fila usadas pelo agente desktop (pedmesa-print-agent) — autenticadas
// por token de empresa (header X-Agent-Token), não por login de usuário.
impressaoRoutes.get("/pendentes", agentAuthMiddleware, listPendentes);
impressaoRoutes.patch("/:id/status", agentAuthMiddleware, updateStatus);

export default impressaoRoutes;
