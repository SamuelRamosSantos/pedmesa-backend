import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { rbacMiddleware } from "../../../shared/middlewares/rbac.middleware";
import { UserRole } from "../../usuarios/entities/user.entity";
import { getMe, regenerarTokenAgente, updateConfiguracoes } from "../controllers/tenant.controller";

const tenantRoutes = Router();

tenantRoutes.use(authMiddleware);

tenantRoutes.get("/me", getMe);
tenantRoutes.patch("/configuracoes", rbacMiddleware([UserRole.ADMIN]), updateConfiguracoes);
tenantRoutes.post("/token-agente", rbacMiddleware([UserRole.ADMIN]), regenerarTokenAgente);

export default tenantRoutes;
