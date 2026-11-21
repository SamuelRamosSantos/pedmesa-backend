import "reflect-metadata";
import cors from "cors";
import express from "express";
import { AppDataSource } from "./config/data-source";
import adminRoutes from "./modules/admin/routes/admin.routes";
import authRoutes from "./modules/auth/routes/auth.routes";
import categoryRoutes from "./modules/categorias/routes/category.routes";
import comandaRoutes from "./modules/comandas/routes/comanda.routes";
import dashboardRoutes from "./modules/dashboard/routes/dashboard.routes";
import impressaoRoutes from "./modules/impressao/routes/impressao.routes";
import leadRoutes from "./modules/leads/routes/lead.routes";
import pedidosRoutes from "./modules/pedidos/routes/pedidos.routes";
import productRoutes from "./modules/produtos/routes/product.routes";
import tenantRoutes from "./modules/tenants/routes/tenant.routes";
import userRoutes from "./modules/usuarios/routes/user.routes";
import { errorHandlerMiddleware } from "./shared/middlewares/error-handler.middleware";

// Instância do Express sem `listen`: o server.ts sobe o servidor e os testes de
// integração usam esta mesma instância pelo Supertest.
export const app = express();

// Não expor a stack tecnológica (Express) nas respostas — evita facilitar
// ataques direcionados a CVEs conhecidas do framework/versão.
app.disable("x-powered-by");

const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(
  ",",
);
app.use(cors({ origin: corsOrigins }));

app.use(express.json());

// Liveness: o processo está de pé. Não consulta o banco.
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    database: AppDataSource.isInitialized ? "connected" : "disconnected",
  });
});

// Readiness: o banco responde. Usado pelo deploy e pelo monitoramento.
app.get("/ready", async (_req, res) => {
  try {
    if (!AppDataSource.isInitialized) {
      throw new Error("Conexão com o banco ainda não inicializada.");
    }

    await AppDataSource.query("SELECT 1");
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("[READY] Banco indisponível:", error);
    res.status(503).json({ status: "indisponivel", database: "disconnected" });
  }
});

app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/categorias", categoryRoutes);
app.use("/api/v1/comandas", comandaRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/impressao", impressaoRoutes);
app.use("/api/v1/leads", leadRoutes);
app.use("/api/v1/pedidos", pedidosRoutes);
app.use("/api/v1/produtos", productRoutes);
app.use("/api/v1/tenants", tenantRoutes);
app.use("/api/v1/usuarios", userRoutes);

app.use(errorHandlerMiddleware);
