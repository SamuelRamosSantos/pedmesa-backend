import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { rbacMiddleware } from "../../../shared/middlewares/rbac.middleware";
import { UserRole } from "../../usuarios/entities/user.entity";
import { getResumo } from "../controllers/dashboard.controller";

const dashboardRoutes = Router();

dashboardRoutes.use(authMiddleware);

dashboardRoutes.get("/", rbacMiddleware([UserRole.ADMIN]), getResumo);

export default dashboardRoutes;
