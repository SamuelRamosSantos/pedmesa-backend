import "reflect-metadata";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { AppDataSource } from "./config/data-source";
import adminRoutes from "./modules/admin/routes/admin.routes";
import authRoutes from "./modules/auth/routes/auth.routes";
import categoryRoutes from "./modules/categorias/routes/category.routes";
import clienteRoutes from "./modules/clientes/routes/cliente.routes";
import comandaRoutes from "./modules/comandas/routes/comanda.routes";
import dashboardRoutes from "./modules/dashboard/routes/dashboard.routes";
import deliveryRoutes from "./modules/delivery/routes/delivery.routes";
import { registrarSincronizacaoPreparoDelivery } from "./modules/delivery/services/sincronizacao-preparo.handler";
import impressaoRoutes from "./modules/impressao/routes/impressao.routes";
import leadRoutes from "./modules/leads/routes/lead.routes";
import pedidosRoutes from "./modules/pedidos/routes/pedidos.routes";
import productRoutes from "./modules/produtos/routes/product.routes";
import tenantRoutes from "./modules/tenants/routes/tenant.routes";
import uploadRoutes from "./modules/uploads/routes/upload.routes";
import userRoutes from "./modules/usuarios/routes/user.routes";
import { errorHandlerMiddleware } from "./shared/middlewares/error-handler.middleware";
import { apiRateLimiter } from "./shared/middlewares/rate-limit.middleware";

// Instância do Express sem `listen`: o server.ts sobe o servidor e os testes de
// integração usam esta mesma instância pelo Supertest.
export const app = express();

// Não expor a stack tecnológica (Express) nas respostas — evita facilitar
// ataques direcionados a CVEs conhecidas do framework/versão.
app.disable("x-powered-by");

// Em produção a API roda atrás do proxy reverso do Coolify (Traefik) — sem isso,
// req.ip sempre resolveria pro IP interno do proxy, e o rate limit abaixo contaria
// TODOS os usuários como um único cliente. "1" = confia só no primeiro hop
// (o proxy imediatamente na frente da API), não numa cadeia arbitrária de proxies.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(
  ",",
);
// credentials: true é obrigatório pro navegador aceitar mandar/receber os cookies
// de autenticação (PED-76) em requisições cross-origin do front — com credentials
// habilitado, o pacote "cors" já reflete a origem específica da allowlist acima
// em vez de "*", que é exigido pelo próprio spec de CORS quando credentials=true.
app.use(cors({ origin: corsOrigins, credentials: true }));

app.use(express.json());
app.use(cookieParser());

// As imagens não passam pela API: ficam no Cloudflare R2 e são servidas pelo
// domínio do bucket (cdn.pedmesa.com.br / cdn-dev.pedmesa.com.br). Ver PED-45.

// Commit gravado na imagem pelo pipeline (build arg GIT_SHA). A verificação final
// do deploy compara este valor com o commit publicado.
const VERSAO = process.env.APP_VERSION || "desenvolvimento";

// Liveness: o processo está de pé. Não consulta o banco.
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    versao: VERSAO,
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

app.use("/api/v1", apiRateLimiter);

app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/categorias", categoryRoutes);
app.use("/api/v1/clientes", clienteRoutes);
app.use("/api/v1/comandas", comandaRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/delivery", deliveryRoutes);
app.use("/api/v1/impressao", impressaoRoutes);
app.use("/api/v1/leads", leadRoutes);
app.use("/api/v1/pedidos", pedidosRoutes);
app.use("/api/v1/produtos", productRoutes);
app.use("/api/v1/tenants", tenantRoutes);
app.use("/api/v1/uploads", uploadRoutes);
app.use("/api/v1/usuarios", userRoutes);

app.use(errorHandlerMiddleware);

// Composição: o delivery escuta mudanças de preparo publicadas pelo módulo de pedidos (PED-98).
registrarSincronizacaoPreparoDelivery();
