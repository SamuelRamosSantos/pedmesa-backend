import { Router } from "express";
import { adminLogout, login, logout } from "../controllers/auth.controller";

const authRoutes = Router();

authRoutes.post("/login", login);
authRoutes.post("/logout", logout);
authRoutes.post("/admin-logout", adminLogout);

export default authRoutes;
