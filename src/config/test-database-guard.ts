interface VariaveisDoBanco {
  NODE_ENV?: string;
  DB_NAME?: string;
  DB_HOST?: string;
}

const HOSTS_LOCAIS = new Set(["localhost", "127.0.0.1", "::1"]);

/**
 * Trava de segurança dos testes: com `NODE_ENV=test`, recusa qualquer banco cujo
 * nome não termine em `_test` ou que não esteja na máquina local (o banco do CI
 * também é exposto em `localhost`). Fora do modo de teste não faz nada.
 */
export function assertBancoDeTeste(env: VariaveisDoBanco): void {
  if (env.NODE_ENV !== "test") {
    return;
  }

  if (env.DB_NAME !== undefined && !env.DB_NAME.endsWith("_test")) {
    throw new Error(
      `[trava de testes] DB_NAME="${env.DB_NAME}" não termina em "_test". ` +
        "Os testes só rodam contra o banco descartável do docker-compose.test.yml.",
    );
  }

  if (env.DB_HOST !== undefined && !HOSTS_LOCAIS.has(env.DB_HOST)) {
    throw new Error(
      `[trava de testes] DB_HOST="${env.DB_HOST}" não é local. ` +
        "Os testes nunca podem apontar para um banco remoto.",
    );
  }
}
