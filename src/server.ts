import "reflect-metadata";
import express from "express";
import { AppDataSource } from "./config/data-source";
import authRoutes from "./modules/auth/routes/auth.routes";
import { errorHandlerMiddleware } from "./shared/middlewares/error-handler.middleware";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    database: AppDataSource.isInitialized ? "connected" : "disconnected",
  });
});

app.use("/api/v1/auth", authRoutes);

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
