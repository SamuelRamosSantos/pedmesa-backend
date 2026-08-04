import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { rbacMiddleware } from "../../../shared/middlewares/rbac.middleware";
import { UserRole } from "../../usuarios/entities/user.entity";
import { list, updateItemStatus } from "../controllers/pedido.controller";

const pedidosRoutes = Router();

pedidosRoutes.use(authMiddleware);

const LIST_ALLOWED_ROLES = [UserRole.ADMIN, UserRole.COZINHA, UserRole.GARCOM];
const ITEM_STATUS_ALLOWED_ROLES = [UserRole.ADMIN, UserRole.GARCOM, UserRole.COZINHA];

pedidosRoutes.get("/", rbacMiddleware(LIST_ALLOWED_ROLES), list);
pedidosRoutes.patch("/itens/:itemId/status", rbacMiddleware(ITEM_STATUS_ALLOWED_ROLES), updateItemStatus);

export default pedidosRoutes;
