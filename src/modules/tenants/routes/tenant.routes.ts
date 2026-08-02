import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { rbacMiddleware } from "../../../shared/middlewares/rbac.middleware";
import { UserRole } from "../../usuarios/entities/user.entity";
import { getMe, updateConfiguracoes } from "../controllers/tenant.controller";

const tenantRoutes = Router();

tenantRoutes.use(authMiddleware);

tenantRoutes.get("/me", getMe);
tenantRoutes.patch("/configuracoes", rbacMiddleware([UserRole.ADMIN]), updateConfiguracoes);

export default tenantRoutes;
