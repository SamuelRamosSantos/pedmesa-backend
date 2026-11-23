import { beforeAll, describe, expect, it } from "vitest";
import { AppDataSource } from "../src/config/data-source";
import { Category } from "../src/modules/categorias/entities/category.entity";
import { TaxaEntrega } from "../src/modules/delivery/entities/taxa-entrega.entity";
import { normalizarLocalidade } from "../src/modules/delivery/services/localidade-normalizer";
import { Product } from "../src/modules/produtos/entities/product.entity";
import {
  Tenant,
  TenantStatus,
} from "../src/modules/tenants/entities/tenant.entity";
import { UserRole } from "../src/modules/usuarios/entities/user.entity";
import { autenticar, criarTenant, criarUsuario } from "./helpers/factories";

type ClienteLogado = Awaited<ReturnType<typeof autenticar>>;

async function prepararTenant(): Promise<{
  tenant: Tenant;
  batata: string;
  cerveja: string;
}> {
  const tenant = await criarTenant();
  await AppDataSource.getRepository(Tenant).update(tenant.id, {
    status: TenantStatus.ATIVO,
    deliveryAtivo: true,
    pedidoMinimoDelivery: 0,
  });
  const taxas = AppDataSource.getRepository(TaxaEntrega);
  await taxas.save(
    taxas.create({
      tenantId: tenant.id,
      cidade: "São Paulo",
      bairro: "Bela Vista",
      cidadeNormalizada: normalizarLocalidade("São Paulo"),
      bairroNormalizado: normalizarLocalidade("Bela Vista"),
      valor: 5,
      ativo: true,
    }),
  );
  const categoria = await AppDataSource.getRepository(Category).save(
    AppDataSource.getRepository(Category).create({
      tenantId: tenant.id,
      nome: "Cardápio",
    }),
  );
  const produtos = AppDataSource.getRepository(Product);
  const batata = await produtos.save(
    produtos.create({
      tenantId: tenant.id,
      categoriaId: categoria.id,
      nome: "Batata Frita",
      preco: 20,
      precisaPreparo: true,
    }),
  );
  const cerveja = await produtos.save(
    produtos.create({
      tenantId: tenant.id,
      categoriaId: categoria.id,
      nome: "Cerveja",
      preco: 10,
      precisaPreparo: false,
    }),
  );

  return { tenant, batata: batata.id, cerveja: cerveja.id };
}

// PED-130: itens no card do painel e detalhe completo da entrega.
describe("expedição: itens no painel e detalhe da entrega (PED-130)", () => {
  let expedicao: ClienteLogado;
  let entregaId: string;
  let outroTenant: ClienteLogado;
  let cozinha: ClienteLogado;

  beforeAll(async () => {
    const { tenant, batata, cerveja } = await prepararTenant();
    expedicao = await autenticar(
      await criarUsuario(tenant, [UserRole.EXPEDICAO]),
    );
    cozinha = await autenticar(await criarUsuario(tenant, [UserRole.COZINHA]));

    const outro = await prepararTenant();
    outroTenant = await autenticar(
      await criarUsuario(outro.tenant, [UserRole.EXPEDICAO]),
    );

    const { body } = await expedicao
      .post("/api/v1/delivery/pedidos")
      .send({
        cliente: { nome: "Maria Souza", telefone: "11987650003" },
        endereco: {
          cep: "01310100",
          logradouro: "Avenida Paulista",
          numero: "1000",
          complemento: "Apto 52",
          bairro: "Bela Vista",
          cidade: "São Paulo",
          uf: "SP",
          referencia: "Portão azul",
        },
        itens: [
          { produto_id: batata, quantidade: 2, observacao: "sem sal" },
          { produto_id: cerveja, quantidade: 1 },
        ],
        forma_pagamento: "dinheiro",
        troco_para: 100,
      })
      .expect(201);
    entregaId = body.entrega_id;
  });

  it("o card do painel traz os produtos, com marca de observação", async () => {
    const { body } = await expedicao
      .get("/api/v1/delivery/entregas")
      .expect(200);
    const card = body.find((c: { id: string }) => c.id === entregaId);

    expect(card.itens).toMatchObject([
      { produto: "Batata Frita", quantidade: 2, tem_observacao: true },
      { produto: "Cerveja", quantidade: 1, tem_observacao: false },
    ]);
  });

  it("o detalhe traz cliente, endereço, itens, valores, pagamento e histórico", async () => {
    const { body } = await expedicao
      .get(`/api/v1/delivery/entregas/${entregaId}`)
      .expect(200);

    expect(body).toMatchObject({
      id: entregaId,
      status_entrega: "em_producao",
      cliente: { nome: "Maria Souza", telefone: "11987650003" },
      endereco: {
        logradouro: "Avenida Paulista",
        complemento: "Apto 52",
        referencia: "Portão azul",
        bairro: "Bela Vista",
      },
      valores: { subtotal: 50, taxa_entrega: 5, total: 55 },
      pagamento: { forma: "dinheiro", troco_para: 100, troco: 45 },
      status_preparo: "pendente",
      passa_pela_cozinha: true,
    });
    expect(
      body.itens.map((i: { produto: string; observacao: string | null }) => [
        i.produto,
        i.observacao,
      ]),
    ).toEqual([
      ["Batata Frita", "sem sal"],
      ["Cerveja", null],
    ]);
    expect(body.historico).toHaveLength(1);
    expect(body.historico[0]).toMatchObject({
      status_anterior: null,
      status_novo: "em_producao",
    });
  });

  it("entrega de outro estabelecimento responde 404", async () => {
    await outroTenant.get(`/api/v1/delivery/entregas/${entregaId}`).expect(404);
  });

  it("papel fora do delivery não acessa; id inválido responde 400", async () => {
    await cozinha.get(`/api/v1/delivery/entregas/${entregaId}`).expect(403);
    await expedicao.get("/api/v1/delivery/entregas/abc").expect(400);
  });
});
