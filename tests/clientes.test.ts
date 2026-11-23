import { randomInt } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { AppDataSource } from "../src/config/data-source";
import { Cliente } from "../src/modules/clientes/entities/cliente.entity";
import { EnderecoCliente } from "../src/modules/clientes/entities/endereco-cliente.entity";
import type { Tenant } from "../src/modules/tenants/entities/tenant.entity";
import { UserRole } from "../src/modules/usuarios/entities/user.entity";
import { autenticar, criarTenant, criarUsuario } from "./helpers/factories";

type ClienteLogado = Awaited<ReturnType<typeof autenticar>>;

// Celular válido e único: DDD 11 + 9 + 8 dígitos aleatórios.
function telefoneUnico(): string {
  return `119${String(randomInt(10_000_000, 100_000_000))}`;
}

async function criarClienteDelivery(
  tenant: Tenant,
  nome: string,
  telefone = telefoneUnico(),
): Promise<Cliente> {
  const repositorio = AppDataSource.getRepository(Cliente);

  return repositorio.save(
    repositorio.create({ tenantId: tenant.id, nome, telefone }),
  );
}

describe("GET /clientes: listagem e busca (PED-122)", () => {
  let tenant: Tenant;
  let expedicao: ClienteLogado;
  let jose: Cliente;
  let maria: Cliente;

  beforeAll(async () => {
    tenant = await criarTenant();
    expedicao = await autenticar(
      await criarUsuario(tenant, [UserRole.EXPEDICAO]),
    );

    jose = await criarClienteDelivery(
      tenant,
      "José da Conceição",
      "11987654321",
    );
    maria = await criarClienteDelivery(tenant, "Maria Souza");
    await criarClienteDelivery(tenant, "Ana 50% Lima");

    const enderecos = AppDataSource.getRepository(EnderecoCliente);
    await enderecos.save(
      enderecos.create({
        tenantId: tenant.id,
        clienteId: maria.id,
        cep: "01310100",
        logradouro: "Avenida Paulista",
        numero: "1000",
        bairro: "Bela Vista",
        cidade: "São Paulo",
        uf: "SP",
        principal: true,
      }),
    );

    // Outro tenant com um nome parecido: nunca pode aparecer.
    await criarClienteDelivery(await criarTenant(), "José Intruso");
  });

  it("sem busca, lista todos do tenant em ordem de nome, com endereços", async () => {
    const { body } = await expedicao.get("/api/v1/clientes").expect(200);

    expect(body).toMatchObject({ total: 3, pagina: 1, por_pagina: 20 });
    expect(body.clientes.map((c: Cliente) => c.nome)).toEqual([
      "Ana 50% Lima",
      "José da Conceição",
      "Maria Souza",
    ]);
    const mariaNaLista = body.clientes.find(
      (c: { id: string }) => c.id === maria.id,
    );
    expect(mariaNaLista.enderecos).toHaveLength(1);
    expect(mariaNaLista.enderecos[0]).toMatchObject({
      bairro: "Bela Vista",
      principal: true,
    });
  });

  it("busca por nome sem diferenciar maiúsculas e acentos, palavra a palavra", async () => {
    const { body } = await expedicao
      .get("/api/v1/clientes")
      .query({ busca: "CONCEICAO jose" })
      .expect(200);

    expect(body.total).toBe(1);
    expect(body.clientes[0].id).toBe(jose.id);
  });

  it("busca por trecho do telefone, com máscara", async () => {
    const { body } = await expedicao
      .get("/api/v1/clientes")
      .query({ busca: "(11) 98765" })
      .expect(200);

    expect(body.clientes.map((c: { id: string }) => c.id)).toEqual([jose.id]);
  });

  it("% do termo é texto literal, não curinga", async () => {
    const { body } = await expedicao
      .get("/api/v1/clientes")
      .query({ busca: "50%" })
      .expect(200);

    expect(body.clientes.map((c: Cliente) => c.nome)).toEqual(["Ana 50% Lima"]);

    const curinga = await expedicao
      .get("/api/v1/clientes")
      .query({ busca: "%" })
      .expect(200);

    expect(curinga.body.total).toBe(1);
  });

  it("pagina os resultados", async () => {
    const { body } = await expedicao
      .get("/api/v1/clientes")
      .query({ pagina: 2, por_pagina: 2 })
      .expect(200);

    expect(body).toMatchObject({ total: 3, pagina: 2, por_pagina: 2 });
    expect(body.clientes.map((c: Cliente) => c.nome)).toEqual(["Maria Souza"]);
  });

  it("a busca exata por telefone continua igual", async () => {
    const { body } = await expedicao
      .get("/api/v1/clientes")
      .query({ telefone: "(11) 98765-4321" })
      .expect(200);

    expect(body.id).toBe(jose.id);
  });

  it("rejeita parâmetros inválidos", async () => {
    await expedicao
      .get("/api/v1/clientes")
      .query({ por_pagina: 500 })
      .expect(400);
  });

  it("papéis fora do delivery não acessam", async () => {
    const cozinha = await autenticar(
      await criarUsuario(tenant, [UserRole.COZINHA]),
    );

    await cozinha.get("/api/v1/clientes").expect(403);
  });
});
