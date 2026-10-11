import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { rbacMiddleware } from "../../../shared/middlewares/rbac.middleware";
import { UserRole } from "../../usuarios/entities/user.entity";
import { cotar } from "../controllers/cotacao.controller";
import { criar, reimprimirTicket, transicionarStatus } from "../controllers/pedido-delivery.controller";
import { createTaxa, listTaxas, removeTaxa, updateTaxa } from "../controllers/taxa-entrega.controller";

const deliveryRoutes = Router();

deliveryRoutes.use(authMiddleware);

// O dono configura onde entrega e quanto cobra. A expedição não precisa listar as taxas:
// recebe o valor já calculado pela cotação de frete (PED-93).
const GERENCIAR_TAXAS_ROLES = [UserRole.ADMIN];

// Quem atende o delivery (ADR-001, decisão 1 do PO).
const ATENDER_DELIVERY_ROLES = [UserRole.ADMIN, UserRole.EXPEDICAO];

deliveryRoutes.post("/cotacao", rbacMiddleware(ATENDER_DELIVERY_ROLES), cotar);
deliveryRoutes.post("/pedidos", rbacMiddleware(ATENDER_DELIVERY_ROLES), criar);
deliveryRoutes.patch("/entregas/:id/status", rbacMiddleware(ATENDER_DELIVERY_ROLES), transicionarStatus);
deliveryRoutes.post("/entregas/:id/reimprimir-ticket", rbacMiddleware(ATENDER_DELIVERY_ROLES), reimprimirTicket);

deliveryRoutes.get("/taxas", rbacMiddleware(GERENCIAR_TAXAS_ROLES), listTaxas);
deliveryRoutes.post("/taxas", rbacMiddleware(GERENCIAR_TAXAS_ROLES), createTaxa);
deliveryRoutes.patch("/taxas/:id", rbacMiddleware(GERENCIAR_TAXAS_ROLES), updateTaxa);
deliveryRoutes.delete("/taxas/:id", rbacMiddleware(GERENCIAR_TAXAS_ROLES), removeTaxa);

export default deliveryRoutes;
