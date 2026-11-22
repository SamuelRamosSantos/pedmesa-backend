import { execSync } from "node:child_process";
import "./load-env";

// Roda uma vez antes da suíte de integração: aplica as migrations e o seed no
// banco de testes. Os processos filhos herdam o NODE_ENV=test e as variáveis do
// .env.test, e a trava do data-source vale também para eles.
export default function setup(): void {
  const opcoes = { stdio: "inherit", env: process.env } as const;

  execSync("npm run migration:run", opcoes);
  execSync("npm run seed", opcoes);
}
