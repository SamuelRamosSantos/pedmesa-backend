import request from "supertest";
import { app } from "../../src/app";

/**
 * Cliente HTTP da suíte. O `agent` mantém cookies entre as requisições como um
 * navegador; a autenticação atual é por `Authorization: Bearer`, então use
 * `.set("Authorization", \`Bearer ${token}\`)` com o token de `autenticar()`.
 */
export function criarCliente() {
  return request.agent(app);
}
