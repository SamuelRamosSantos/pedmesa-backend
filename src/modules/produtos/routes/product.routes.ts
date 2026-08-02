import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { rbacMiddleware } from "../../../shared/middlewares/rbac.middleware";
import { UserRole } from "../../usuarios/entities/user.entity";
import { create, list, updateDisponibilidade } from "../controllers/product.controller";

const productRoutes = Router();

productRoutes.use(authMiddleware);

productRoutes.post("/", rbacMiddleware([UserRole.ADMIN]), create);
productRoutes.get(
  "/",
  rbacMiddleware([UserRole.ADMIN, UserRole.GARCOM, UserRole.COZINHA, UserRole.CAIXA]),
  list
);
productRoutes.patch(
  "/:id/disponibilidade",
  rbacMiddleware([UserRole.ADMIN, UserRole.COZINHA]),
  updateDisponibilidade
);

export default productRoutes;
