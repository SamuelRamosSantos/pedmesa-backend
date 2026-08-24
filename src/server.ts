import "reflect-metadata";
import cookieParser from "cookie-parser";
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
import uploadRoutes from "./modules/uploads/routes/upload.routes";
import userRoutes from "./modules/usuarios/routes/user.routes";
import { errorHandlerMiddleware } from "./shared/middlewares/error-handler.middleware";
import { UPLOADS_DIR, UPLOADS_URL_PREFIX } from "./shared/storage/local-disk.storage";

const app = express();

// Não expor a stack tecnológica (Express) nas respostas — evita facilitar
// ataques direcionados a CVEs conhecidas do framework/versão.
app.disable("x-powered-by");

const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(",");
// credentials: true é obrigatório pro navegador aceitar mandar/receber os cookies
// de autenticação (PED-76) em requisições cross-origin do front — com credentials
// habilitado, o pacote "cors" já reflete a origem específica da allowlist acima
// em vez de "*", que é exigido pelo próprio spec de CORS quando credentials=true.
app.use(cors({ origin: corsOrigins, credentials: true }));

app.use(express.json());
app.use(cookieParser());

// Só usado quando STORAGE_DRIVER=local (padrão em dev) — em produção com S3 as
// imagens são servidas diretamente pelo bucket/CDN, não pela API.
app.use(UPLOADS_URL_PREFIX, express.static(UPLOADS_DIR));

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    database: AppDataSource.isInitialized ? "connected" : "disconnected",
  });
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
app.use("/api/v1/uploads", uploadRoutes);
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
