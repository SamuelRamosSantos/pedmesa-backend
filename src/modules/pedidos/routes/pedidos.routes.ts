import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { requirePodeExcluirItemFechamento } from "../../../shared/middlewares/permissao.middleware";
import { rbacMiddleware } from "../../../shared/middlewares/rbac.middleware";
import { UserRole } from "../../usuarios/entities/user.entity";
import { deleteItem, deleteOwnPedido, list, updateItemStatus } from "../controllers/pedido.controller";

const pedidosRoutes = Router();

pedidosRoutes.use(authMiddleware);

const LIST_ALLOWED_ROLES = [UserRole.ADMIN, UserRole.COZINHA, UserRole.GARCOM];
const ITEM_STATUS_ALLOWED_ROLES = [UserRole.ADMIN, UserRole.GARCOM, UserRole.COZINHA];
const DELETE_ITEM_ALLOWED_ROLES = [UserRole.ADMIN, UserRole.CAIXA];
const DELETE_PEDIDO_ALLOWED_ROLES = [UserRole.ADMIN, UserRole.GARCOM];

pedidosRoutes.get("/", rbacMiddleware(LIST_ALLOWED_ROLES), list);
pedidosRoutes.patch("/itens/:itemId/status", rbacMiddleware(ITEM_STATUS_ALLOWED_ROLES), updateItemStatus);
pedidosRoutes.delete(
  "/itens/:itemId",
  rbacMiddleware(DELETE_ITEM_ALLOWED_ROLES),
  requirePodeExcluirItemFechamento,
  deleteItem
);
pedidosRoutes.delete("/:id", rbacMiddleware(DELETE_PEDIDO_ALLOWED_ROLES), deleteOwnPedido);

export default pedidosRoutes;
