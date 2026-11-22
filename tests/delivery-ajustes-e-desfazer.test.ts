import { beforeAll, describe, expect, it } from "vitest";
import { AppDataSource } from "../src/config/data-source";
import { Category } from "../src/modules/categorias/entities/category.entity";
import {
  Comanda,
  ComandaStatus,
} from "../src/modules/comandas/entities/comanda.entity";
import { PagamentoComanda } from "../src/modules/comandas/entities/pagamento-comanda.entity";
import { Entrega } from "../src/modules/delivery/entities/entrega.entity";
import { TaxaEntrega } from "../src/modules/delivery/entities/taxa-entrega.entity";
import { normalizarLocalidade } from "../src/modules/delivery/services/localidade-normalizer";
import { Product } from "../src/modules/produtos/entities/product.entity";
import {
  Tenant,
  TenantStatus,
} from "../src/modules/tenants/entities/tenant.entity";
import { User, UserRole } from "../src/modules/usuarios/entities/user.entity";
import { autenticar, criarTenant, criarUsuario } from "./helpers/factories";

type ClienteLogado = Awaited<ReturnType<typeof autenticar>>;

const AJUSTES = {
  desconto_tipo: "percentual",
  desconto_valor: 10,
  isentar_taxa_entrega: true,
};

describe("delivery: desconto, isenção da taxa (PED-126) e desfazer entrega (PED-127)", () => {
  let tenant: Tenant;
  let semPermissao: ClienteLogado;
  let gerente: ClienteLogado;
  let pedidoBase: Record<string, unknown>;

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
        valor: 8,
        tempoEstimadoMin: 40,
        ativo: true,
      }),
    );

    const categoria = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({
        tenantId: tenant.id,
        nome: "Bebidas",
      }),
    );
    // Sem preparo: a entrega nasce pronta para envio.
    const produto = await AppDataSource.getRepository(Product).save(
      AppDataSource.getRepository(Product).create({
        tenantId: tenant.id,
        categoriaId: categoria.id,
        nome: "Suco",
        preco: 20,
        precisaPreparo: false,
      }),
    );

    semPermissao = await autenticar(
      await criarUsuario(tenant, [UserRole.EXPEDICAO]),
    );
    const usuarioGerente = await criarUsuario(tenant, [UserRole.EXPEDICAO]);
    await AppDataSource.getRepository(User).update(usuarioGerente.id, {
      podeConcederDesconto: true,
    });
    gerente = await autenticar(usuarioGerente);

    pedidoBase = {
      cliente: { nome: "Cliente de teste", telefone: "11987650000" },
      endereco: {
        cep: "01310100",
        logradouro: "Avenida Paulista",
        numero: "1000",
        bairro: "Bela Vista",
        cidade: "São Paulo",
        uf: "SP",
      },
      itens: [{ produto_id: produto.id, quantidade: 2 }],
      forma_pagamento: "dinheiro",
      troco_para: 50,
    };
  });

  it("cotação aplica desconto nos itens e isenta a taxa", async () => {
    const { body } = await semPermissao
      .post("/api/v1/delivery/cotacao")
      .send({
        endereco: { cidade: "São Paulo", bairro: "Bela Vista" },
        itens: pedidoBase.itens,
        forma_pagamento: "dinheiro",
        troco_para: 50,
        ...AJUSTES,
      })
      .expect(200);

    expect(body).toMatchObject({
      subtotal: 40,
      desconto_aplicado: 4,
      taxa_entrega: 0,
      taxa_entrega_bairro: 8,
      taxa_isenta: true,
      total: 36,
      troco: 14,
    });
  });

  it("criar com desconto exige a permissão de desconto", async () => {
    await semPermissao
      .post("/api/v1/delivery/pedidos")
      .send({ ...pedidoBase, ...AJUSTES })
      .expect(403);
  });

  it("entregar, desfazer e entregar de novo", async () => {
    const { body: criado } = await gerente
      .post("/api/v1/delivery/pedidos")
      .send({ ...pedidoBase, ...AJUSTES })
      .expect(201);
    expect(criado.total).toBe(36);

    const entregaId: string = criado.entrega_id;
    const comandaId: string = criado.comanda_id;
    const entregas = AppDataSource.getRepository(Entrega);
    const transicionar = async (status: string, motivo?: string) => {
      const { versao } = await entregas.findOneByOrFail({ id: entregaId });
      return gerente
        .patch(`/api/v1/delivery/entregas/${entregaId}/status`)
        .send({ status, versao, motivo });
    };
    const pagamentos = () =>
      AppDataSource.getRepository(PagamentoComanda).findBy({ comandaId });
    const comanda = () =>
      AppDataSource.getRepository(Comanda).findOneByOrFail({ id: comandaId });

    await transicionar("em_rota").then((r) => expect(r.status).toBe(200));
    await transicionar("entregue").then((r) => expect(r.status).toBe(200));

    const [automatico] = await pagamentos();
    expect(automatico.valor).toBe(36);
    expect((await comanda()).status).toBe(ComandaStatus.FECHADA);
    expect(
      (await entregas.findOneByOrFail({ id: entregaId })).pagamentoAutomaticoId,
    ).toBe(automatico.id);

    await transicionar("em_rota").then((r) => expect(r.status).toBe(400));
    await transicionar("em_rota", "Marquei por engano").then((r) =>
      expect(r.status).toBe(200),
    );

    expect(await pagamentos()).toHaveLength(0);
    expect((await comanda()).status).toBe(ComandaStatus.ABERTA);
    expect(
      (await entregas.findOneByOrFail({ id: entregaId })).entregueEm,
    ).toBeNull();

    await transicionar("entregue").then((r) => expect(r.status).toBe(200));
    expect((await pagamentos()).map((p) => p.valor)).toEqual([36]);
    expect((await comanda()).totalFinal).toBe(36);
  });
});
