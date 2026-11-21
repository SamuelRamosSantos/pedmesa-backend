import { afterAll, beforeAll } from "vitest";
import { AppDataSource } from "../../src/config/data-source";
import { entidades, migrations } from "./typeorm-modules";

beforeAll(async () => {
  if (!AppDataSource.isInitialized) {
    // Troca os globs de arquivo pelas classes carregadas pelo Vite (ver typeorm-modules.ts).
    AppDataSource.setOptions({ entities: entidades, migrations });
    await AppDataSource.initialize();
  }
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});
