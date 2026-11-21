import { config } from "dotenv";
import { assertBancoDeTeste } from "../../src/config/test-database-guard";

// Força o modo de teste antes de qualquer import do código da API: com isso o
// carregarEnv() do data-source lê o .env.test e nunca o .env da VPS.
process.env.NODE_ENV = "test";

// Não sobrescreve o que já veio do ambiente (no CI as variáveis vêm do workflow).
config({ path: ".env.test" });

function falhar(mensagem: string): never {
  // Impresso também no console: no globalSetup o erro lançado pode ficar escondido.
  console.error(`\n${mensagem}\n`);
  throw new Error(mensagem);
}

if (!process.env.DB_NAME) {
  falhar(
    "[trava de testes] DB_NAME não definido. Copie .env.test.example para .env.test " +
      "e suba o banco com: docker compose -f docker-compose.test.yml up -d",
  );
}

try {
  assertBancoDeTeste(process.env);
} catch (error) {
  falhar(error instanceof Error ? error.message : String(error));
}
