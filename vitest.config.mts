import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    projects: [
      {
        extends: true,
        test: {
          // Lógica pura (DTO validators, calculators): sem banco, ao lado do código.
          name: "unit",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          // API de ponta a ponta com Supertest contra o banco do docker-compose.test.yml.
          name: "integration",
          include: ["tests/**/*.test.ts"],
          globalSetup: ["tests/setup/global.ts"],
          setupFiles: ["tests/setup/env.ts", "tests/setup/database.ts"],
          // Os testes de integração compartilham o mesmo banco, então rodam em sequência.
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
