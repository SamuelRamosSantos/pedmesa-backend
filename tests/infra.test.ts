import { describe, expect, it } from "vitest";
import { AppDataSource } from "../src/config/data-source";
import { UserRole } from "../src/modules/usuarios/entities/user.entity";
import { criarCliente } from "./helpers/client";
import { autenticar, criarTenant, criarUsuario } from "./helpers/factories";

describe("infraestrutura da suíte", () => {
  it("está conectada a um banco terminado em _test", async () => {
    const [linha] = await AppDataSource.query(
      "SELECT current_database() AS nome",
    );

    expect(String(linha.nome)).toMatch(/_test$/);
  });

  it("aplicou todas as migrations", async () => {
    expect(await AppDataSource.showMigrations()).toBe(false);
  });

  it("autentica um usuário criado pelas factories", async () => {
    const tenant = await criarTenant();
    const usuario = await criarUsuario(tenant, [UserRole.ADMIN]);
    const token = await autenticar(usuario);

    const resposta = await criarCliente()
      .get("/api/v1/tenants/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(resposta.body.id).toBe(tenant.id);
  });

  it("recusa rota protegida sem token", async () => {
    await criarCliente().get("/api/v1/tenants/me").expect(401);
  });
});
