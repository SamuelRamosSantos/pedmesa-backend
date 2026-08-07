import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { rbacMiddleware } from "../../../shared/middlewares/rbac.middleware";
import { UserRole } from "../../usuarios/entities/user.entity";
import { listPendentes, updateStatus } from "../controllers/fila-impressao.controller";
import { create, list, remove, update } from "../controllers/impressora.controller";

const impressaoRoutes = Router();

impressaoRoutes.use(authMiddleware);

const ALLOWED_ROLES = [UserRole.ADMIN];

impressaoRoutes.get("/impressoras", rbacMiddleware(ALLOWED_ROLES), list);
impressaoRoutes.post("/impressoras", rbacMiddleware(ALLOWED_ROLES), create);
impressaoRoutes.patch("/impressoras/:id", rbacMiddleware(ALLOWED_ROLES), update);
impressaoRoutes.delete("/impressoras/:id", rbacMiddleware(ALLOWED_ROLES), remove);

impressaoRoutes.get("/pendentes", rbacMiddleware(ALLOWED_ROLES), listPendentes);
impressaoRoutes.patch("/:id/status", rbacMiddleware(ALLOWED_ROLES), updateStatus);

export default impressaoRoutes;
