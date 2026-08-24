import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { rbacMiddleware } from "../../../shared/middlewares/rbac.middleware";
import { UserRole } from "../../usuarios/entities/user.entity";
import { uploadImagem } from "../controllers/upload.controller";
import { parseUploadedFile } from "../middlewares/parse-upload.middleware";

const uploadRoutes = Router();

uploadRoutes.use(authMiddleware);
uploadRoutes.use(rbacMiddleware([UserRole.ADMIN]));

uploadRoutes.post("/", parseUploadedFile, uploadImagem);

export default uploadRoutes;
