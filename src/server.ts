import { app } from "./app";
import { AppDataSource } from "./config/data-source";
import { getStorageService } from "./shared/storage/get-storage-service";

const PORT = Number(process.env.PORT ?? 3000);

// Sem storage de imagens configurado, a API não sobe: melhor falhar no deploy do
// que no primeiro upload de um cliente.
try {
  getStorageService();
} catch (error) {
  console.error(
    "❌ Configuração do armazenamento de imagens inválida:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
}

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
