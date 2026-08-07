import "reflect-metadata";
import cors from "cors";
import express from "express";
import { AppDataSource } from "./config/data-source";
import authRoutes from "./modules/auth/routes/auth.routes";
import categoryRoutes from "./modules/categorias/routes/category.routes";
import comandaRoutes from "./modules/comandas/routes/comanda.routes";
import dashboardRoutes from "./modules/dashboard/routes/dashboard.routes";
import pedidosRoutes from "./modules/pedidos/routes/pedidos.routes";
import productRoutes from "./modules/produtos/routes/product.routes";
import tenantRoutes from "./modules/tenants/routes/tenant.routes";
import userRoutes from "./modules/usuarios/routes/user.routes";
import { errorHandlerMiddleware } from "./shared/middlewares/error-handler.middleware";

const app = express();

const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(",");
app.use(cors({ origin: corsOrigins }));

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    database: AppDataSource.isInitialized ? "connected" : "disconnected",
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/categorias", categoryRoutes);
app.use("/api/v1/comandas", comandaRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/pedidos", pedidosRoutes);
app.use("/api/v1/produtos", productRoutes);
app.use("/api/v1/tenants", tenantRoutes);
app.use("/api/v1/usuarios", userRoutes);

app.use(errorHandlerMiddleware);

const PORT = Number(process.env.PORT ?? 3000);

AppDataSource.initialize()
  .then(() => {
    console.log("✅ Conexão com o banco de dados estabelecida com sucesso!");

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Erro ao conectar com o banco de dados:", error);
    process.exit(1);
  });
