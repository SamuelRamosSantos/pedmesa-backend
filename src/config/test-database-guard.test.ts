import { describe, expect, it } from "vitest";
import { assertBancoDeTeste } from "./test-database-guard";

describe("assertBancoDeTeste", () => {
  it("não faz nada fora do modo de teste", () => {
    expect(() =>
      assertBancoDeTeste({
        NODE_ENV: "development",
        DB_NAME: "pedmesa_db",
        DB_HOST: "10.0.0.5",
      }),
    ).not.toThrow();
  });

  it("aceita banco local terminado em _test", () => {
    expect(() =>
      assertBancoDeTeste({
        NODE_ENV: "test",
        DB_NAME: "pedmesa_test",
        DB_HOST: "localhost",
      }),
    ).not.toThrow();
  });

  it("recusa banco cujo nome não termina em _test", () => {
    expect(() =>
      assertBancoDeTeste({
        NODE_ENV: "test",
        DB_NAME: "pedmesa_db",
        DB_HOST: "localhost",
      }),
    ).toThrow(/_test/);
  });

  it("recusa banco remoto mesmo com o nome certo", () => {
    expect(() =>
      assertBancoDeTeste({
        NODE_ENV: "test",
        DB_NAME: "pedmesa_test",
        DB_HOST: "api-dev.pedmesa.com.br",
      }),
    ).toThrow(/não é local/);
  });
});
