import { Router } from "express";
import { authRateLimiter } from "../../../shared/middlewares/rate-limit.middleware";
import { adminLogout, login, logout } from "../controllers/auth.controller";

const authRoutes = Router();

authRoutes.post("/login", authRateLimiter, login);
authRoutes.post("/logout", logout);
authRoutes.post("/admin-logout", adminLogout);

export default authRoutes;
