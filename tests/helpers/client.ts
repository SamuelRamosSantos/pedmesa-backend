import request from "supertest";
import { app } from "../../src/app";

/**
 * Cliente HTTP da suíte. O `agent` mantém cookies entre as requisições como um
 * navegador, e a sessão da API é um cookie HttpOnly: para um cliente logado, use
 * `autenticar()` das factories.
 */
export function criarCliente() {
  return request.agent(app);
}
