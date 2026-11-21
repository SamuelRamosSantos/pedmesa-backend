import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { rbacMiddleware } from "../../../shared/middlewares/rbac.middleware";
import { UserRole } from "../../usuarios/entities/user.entity";
import {
  buscarPorTelefone,
  create,
  createEndereco,
  removeEndereco,
  update,
  updateEndereco,
} from "../controllers/cliente.controller";

const clienteRoutes = Router();

clienteRoutes.use(authMiddleware);

// Quem atende o delivery (ADR-001, decisão 1 do PO).
const CLIENTES_ROLES = [UserRole.ADMIN, UserRole.EXPEDICAO];

clienteRoutes.use(rbacMiddleware(CLIENTES_ROLES));

clienteRoutes.get("/", buscarPorTelefone);
clienteRoutes.post("/", create);
clienteRoutes.patch("/:id", update);
clienteRoutes.post("/:id/enderecos", createEndereco);
clienteRoutes.patch("/:id/enderecos/:enderecoId", updateEndereco);
clienteRoutes.delete("/:id/enderecos/:enderecoId", removeEndereco);

export default clienteRoutes;
