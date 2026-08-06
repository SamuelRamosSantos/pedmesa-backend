import { Router } from "express";
import pedidoRoutes from "../../pedidos/routes/pedido.routes";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { rbacMiddleware } from "../../../shared/middlewares/rbac.middleware";
import { UserRole } from "../../usuarios/entities/user.entity";
import {
  addIntegrante,
  addPagamento,
  atualizarDesconto,
  cancelar,
  create,
  fechar,
  getExtrato,
  juntar,
  list,
  removePagamento,
} from "../controllers/comanda.controller";

const comandaRoutes = Router();

comandaRoutes.use(authMiddleware);

const ALLOWED_ROLES = [UserRole.ADMIN, UserRole.GARCOM, UserRole.CAIXA];
const ALLOWED_ROLES_FECHAR = [UserRole.ADMIN, UserRole.CAIXA];
const ALLOWED_ROLES_CANCELAR = [UserRole.ADMIN, UserRole.CAIXA, UserRole.GARCOM];

comandaRoutes.post("/", rbacMiddleware(ALLOWED_ROLES), create);
comandaRoutes.get("/", rbacMiddleware(ALLOWED_ROLES), list);
comandaRoutes.post("/juntar", rbacMiddleware(ALLOWED_ROLES), juntar);
comandaRoutes.post("/:id/integrantes", rbacMiddleware(ALLOWED_ROLES), addIntegrante);
comandaRoutes.get("/:id/extrato", rbacMiddleware(ALLOWED_ROLES), getExtrato);
comandaRoutes.post("/:id/pagamentos", rbacMiddleware(ALLOWED_ROLES_FECHAR), addPagamento);
comandaRoutes.delete("/:id/pagamentos/:pagamentoId", rbacMiddleware(ALLOWED_ROLES_FECHAR), removePagamento);
comandaRoutes.put("/:id/desconto", rbacMiddleware(ALLOWED_ROLES_FECHAR), atualizarDesconto);
comandaRoutes.post("/:id/fechar", rbacMiddleware(ALLOWED_ROLES_FECHAR), fechar);
comandaRoutes.post("/:id/cancelar", rbacMiddleware(ALLOWED_ROLES_CANCELAR), cancelar);
comandaRoutes.use("/:comandaId/pedidos", pedidoRoutes);

export default comandaRoutes;
