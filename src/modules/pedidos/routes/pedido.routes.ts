import { Router } from "express";
import { rbacMiddleware } from "../../../shared/middlewares/rbac.middleware";
import { UserRole } from "../../usuarios/entities/user.entity";
import { create } from "../controllers/pedido.controller";

const pedidoRoutes = Router({ mergeParams: true });

pedidoRoutes.post("/", rbacMiddleware([UserRole.ADMIN, UserRole.GARCOM]), create);

export default pedidoRoutes;
