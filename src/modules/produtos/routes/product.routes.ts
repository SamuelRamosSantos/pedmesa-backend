import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { rbacMiddleware } from "../../../shared/middlewares/rbac.middleware";
import { UserRole } from "../../usuarios/entities/user.entity";
import { create, list, remove, update, updateDisponibilidade } from "../controllers/product.controller";

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
productRoutes.put("/:id", rbacMiddleware([UserRole.ADMIN]), update);
productRoutes.delete("/:id", rbacMiddleware([UserRole.ADMIN]), remove);

export default productRoutes;
