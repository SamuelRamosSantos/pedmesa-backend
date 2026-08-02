import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { rbacMiddleware } from "../../../shared/middlewares/rbac.middleware";
import { UserRole } from "../../usuarios/entities/user.entity";
import { list, updateStatus } from "../controllers/pedido.controller";

const pedidosRoutes = Router();

pedidosRoutes.use(authMiddleware);

const ALLOWED_ROLES = [UserRole.ADMIN, UserRole.COZINHA];

pedidosRoutes.get("/", rbacMiddleware(ALLOWED_ROLES), list);
pedidosRoutes.patch("/:id/status", rbacMiddleware(ALLOWED_ROLES), updateStatus);

export default pedidosRoutes;
