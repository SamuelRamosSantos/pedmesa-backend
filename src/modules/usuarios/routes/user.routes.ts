import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { rbacMiddleware } from "../../../shared/middlewares/rbac.middleware";
import { UserRole } from "../entities/user.entity";
import { changePassword, create, list, update, updateAtivo } from "../controllers/user.controller";

const userRoutes = Router();

userRoutes.use(authMiddleware);
userRoutes.use(rbacMiddleware([UserRole.ADMIN]));

userRoutes.post("/", create);
userRoutes.get("/", list);
userRoutes.put("/:id", update);
userRoutes.patch("/:id/senha", changePassword);
userRoutes.patch("/:id/ativo", updateAtivo);

export default userRoutes;
