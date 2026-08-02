import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { rbacMiddleware } from "../../../shared/middlewares/rbac.middleware";
import { UserRole } from "../../usuarios/entities/user.entity";
import { create, list } from "../controllers/category.controller";

const categoryRoutes = Router();

categoryRoutes.use(authMiddleware);

categoryRoutes.post("/", rbacMiddleware([UserRole.ADMIN]), create);
categoryRoutes.get("/", rbacMiddleware([UserRole.ADMIN, UserRole.GARCOM, UserRole.CAIXA]), list);

export default categoryRoutes;
