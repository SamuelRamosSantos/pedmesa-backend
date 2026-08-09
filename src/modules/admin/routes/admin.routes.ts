import { Router } from "express";
import { superAdminAuthMiddleware } from "../../../shared/middlewares/super-admin-auth.middleware";
import { list as listLeads } from "../controllers/lead-admin.controller";
import { create, impersonar, list, update, updateStatus } from "../controllers/tenant-admin.controller";

const adminRoutes = Router();

adminRoutes.use(superAdminAuthMiddleware);

adminRoutes.post("/tenants", create);
adminRoutes.get("/tenants", list);
adminRoutes.patch("/tenants/:id", update);
adminRoutes.patch("/tenants/:id/status", updateStatus);
adminRoutes.post("/tenants/:id/impersonar", impersonar);

adminRoutes.get("/leads", listLeads);

export default adminRoutes;
