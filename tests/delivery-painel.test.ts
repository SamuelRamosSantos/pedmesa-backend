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

interface CardPainel {
  id: string;
  status_entrega: string;
  status_preparo: string;
  passa_pela_cozinha: boolean;
}

// PED-129: o painel da expedição mostra o status da cozinha com a mesma regra do KDS,
// só com os itens que a cozinha prepara.
describe("GET /delivery/entregas: status da cozinha igual ao KDS (PED-129)", () => {
  let tenant: Tenant;
  let expedicao: ClienteLogado;
  let cozinha: ClienteLogado;
  const produtos: Record<string, string> = {};

  const ENDERECO = {
    cep: "01310100",
    logradouro: "Avenida Paulista",
    numero: "1000",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    uf: "SP",
  };

  async function criarPedido(
    telefone: string,
    itens: { produto: string; quantidade: number }[],
  ): Promise<string> {
    const { body } = await expedicao
      .post("/api/v1/delivery/pedidos")
      .send({
        cliente: { nome: "Cliente de teste", telefone },
        endereco: ENDERECO,
        itens: itens.map((item) => ({
          produto_id: produtos[item.produto],
          quantidade: item.quantidade,
        })),
        forma_pagamento: "pix",
      })
      .expect(201);

    return body.entrega_id;
  }

  async function card(entregaId: string): Promise<CardPainel> {
    const { body } = await expedicao
      .get("/api/v1/delivery/entregas")
      .expect(200);
    const encontrado = (body as CardPainel[]).find((c) => c.id === entregaId);

    if (!encontrado) {
      throw new Error(`entrega ${entregaId} fora do painel`);
    }

    return encontrado;
  }

  beforeAll(async () => {
    tenant = await criarTenant();
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
    const repositorio = AppDataSource.getRepository(Product);
    for (const [nome, precisaPreparo] of [
      ["Batata Frita", true],
      ["Cerveja", false],
      ["Refrigerante", false],
    ] as const) {
      const produto = await repositorio.save(
        repositorio.create({
          tenantId: tenant.id,
          categoriaId: categoria.id,
          nome,
          preco: 10,
          precisaPreparo,
        }),
      );
      produtos[nome] = produto.id;
    }

    expedicao = await autenticar(
      await criarUsuario(tenant, [UserRole.EXPEDICAO]),
    );
    cozinha = await autenticar(await criarUsuario(tenant, [UserRole.COZINHA]));
  });

  it("pedido misto: só a batata conta; segue a cozinha do pendente ao pronto", async () => {
    const entregaId = await criarPedido("11987650001", [
      { produto: "Batata Frita", quantidade: 1 },
      { produto: "Cerveja", quantidade: 1 },
    ]);

    // A cerveja nasce pronta, mas a cozinha não começou: pendente (antes: "em_preparo").
    expect(await card(entregaId)).toMatchObject({
      status_entrega: "em_producao",
      status_preparo: "pendente",
      passa_pela_cozinha: true,
    });

    const [batata] = await AppDataSource.query(
      `SELECT i.id FROM itens_pedido i
         JOIN pedidos p ON p.id = i.pedido_id
         JOIN entregas e ON e.comanda_id = p.comanda_id
        WHERE e.id = $1 AND i.produto_id = $2`,
      [entregaId, produtos["Batata Frita"]],
    );

    await cozinha
      .patch(`/api/v1/pedidos/itens/${batata.id}/status`)
      .send({ status: "em_preparo" })
      .expect(200);
    expect((await card(entregaId)).status_preparo).toBe("em_preparo");

    await cozinha
      .patch(`/api/v1/pedidos/itens/${batata.id}/status`)
      .send({ status: "pronto" })
      .expect(200);
    expect(await card(entregaId)).toMatchObject({
      status_preparo: "pronto",
      status_entrega: "pronto_para_envio",
    });
  });

  it("pedido só com itens sem preparo: não passa pela cozinha", async () => {
    const entregaId = await criarPedido("11987650002", [
      { produto: "Refrigerante", quantidade: 2 },
    ]);

    expect(await card(entregaId)).toMatchObject({
      status_entrega: "pronto_para_envio",
      status_preparo: "pronto",
      passa_pela_cozinha: false,
    });
  });
});
