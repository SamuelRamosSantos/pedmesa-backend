import * as dotenv from "dotenv";

/**
 * Carrega as variáveis de ambiente do arquivo certo para o modo de execução.
 *
 * Em teste (`NODE_ENV=test`) lê só o `.env.test`: o `.env` de desenvolvimento
 * aponta para o Postgres compartilhado da VPS e não pode vazar para a suíte.
 * Variáveis que já vieram do ambiente (por exemplo, no CI) não são sobrescritas.
 */
export function carregarEnv(): void {
  dotenv.config({
    path: process.env.NODE_ENV === "test" ? ".env.test" : ".env",
  });
}
