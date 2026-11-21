import { describe, expect, it } from "vitest";
import { criarCliente } from "./helpers/client";

describe("saúde da API", () => {
  it("GET /health responde 200 sem depender do banco", async () => {
    const resposta = await criarCliente().get("/health").expect(200);

    expect(resposta.body.status).toBe("ok");
  });

  it("GET /ready responde 200 quando o banco responde", async () => {
    const resposta = await criarCliente().get("/ready").expect(200);

    expect(resposta.body).toEqual({ status: "ok", database: "connected" });
  });

  it("não expõe o cabeçalho X-Powered-By", async () => {
    const resposta = await criarCliente().get("/health");

    expect(resposta.headers["x-powered-by"]).toBeUndefined();
  });
});
