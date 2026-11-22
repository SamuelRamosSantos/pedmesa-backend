import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { AppDataSource } from "../src/config/data-source";
import { Category } from "../src/modules/categorias/entities/category.entity";
import { Product } from "../src/modules/produtos/entities/product.entity";
import type { Tenant } from "../src/modules/tenants/entities/tenant.entity";
import { UserRole } from "../src/modules/usuarios/entities/user.entity";
import { getStorageService } from "../src/shared/storage/get-storage-service";
import { MemoriaStorageService } from "../src/shared/storage/memoria.storage";
import {
  autenticar,
  criarTenant,
  criarUsuario,
  SENHA_PADRAO,
} from "./helpers/factories";

type ClienteLogado = Awaited<ReturnType<typeof autenticar>>;

const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);

function storageDosTestes(): MemoriaStorageService {
  const storage = getStorageService();

  if (!(storage instanceof MemoriaStorageService)) {
    throw new Error("A suíte precisa rodar com STORAGE_DRIVER=memoria.");
  }

  return storage;
}

function enviarImagem(
  cliente: ClienteLogado,
  conteudo: Buffer,
  contentType = "image/png",
) {
  return cliente
    .post("/api/v1/uploads")
    .attach("file", conteudo, { filename: "foto.png", contentType });
}

async function urlPendente(cliente: ClienteLogado): Promise<string> {
  const resposta = await enviarImagem(cliente, PNG).expect(201);

  return resposta.body.url;
}

async function criarProduto(tenant: Tenant): Promise<Product> {
  const categoria = await AppDataSource.getRepository(Category).save(
    AppDataSource.getRepository(Category).create({
      tenantId: tenant.id,
      nome: `Categoria ${randomUUID().slice(0, 8)}`,
    }),
  );

  return AppDataSource.getRepository(Product).save(
    AppDataSource.getRepository(Product).create({
      tenantId: tenant.id,
      categoriaId: categoria.id,
      nome: "Produto de teste",
      preco: 10,
    }),
  );
}

describe("upload de imagens", () => {
  let tenant: Tenant;
  let admin: ClienteLogado;

  beforeAll(async () => {
    tenant = await criarTenant();
    admin = await autenticar(await criarUsuario(tenant, [UserRole.ADMIN]));
  });

  it("grava o upload na pasta de pendentes do tenant", async () => {
    const url = await urlPendente(admin);

    expect(url).toMatch(
      new RegExp(`/pendentes/tenants/${tenant.id}/[0-9a-f-]{36}\\.png$`),
    );
    expect(storageDosTestes().contem(url)).toBe(true);
  });

  it("recusa um arquivo que não é imagem mesmo declarado como image/png", async () => {
    const resposta = await enviarImagem(
      admin,
      Buffer.from("<html><script>alert(1)</script></html>"),
    ).expect(400);

    expect(resposta.body.message).toMatch(/JPG, PNG ou WEBP/);
  });

  it("ao salvar, promove o upload para a pasta definitiva e apaga o pendente", async () => {
    const produto = await criarProduto(tenant);
    const pendente = await urlPendente(admin);
    const storage = storageDosTestes();

    const resposta = await admin
      .put(`/api/v1/produtos/${produto.id}`)
      .send({ imagem_url: pendente })
      .expect(200);
    const definitiva: string = resposta.body.imagem_url;

    expect(definitiva).toBe(pendente.replace("/pendentes/", "/"));
    expect(storage.contem(definitiva)).toBe(true);
    expect(storage.contem(pendente)).toBe(false);
  });

  it("upload não salvo continua só em pendentes (a regra do bucket apaga)", async () => {
    const pendente = await urlPendente(admin);
    const storage = storageDosTestes();

    expect(storage.contem(pendente)).toBe(true);
    expect(storage.contem(pendente.replace("/pendentes/", "/"))).toBe(false);
  });

  it("recusa URL externa, de outro tenant ou de uma imagem já em uso", async () => {
    const produto = await criarProduto(tenant);
    const outroTenant = await criarTenant();
    const outroAdmin = await autenticar(
      await criarUsuario(outroTenant, [UserRole.ADMIN]),
    );
    const pendenteDeOutroTenant = await urlPendente(outroAdmin);

    const outroProduto = await criarProduto(tenant);
    const { body } = await admin
      .put(`/api/v1/produtos/${outroProduto.id}`)
      .send({ imagem_url: await urlPendente(admin) })
      .expect(200);
    const imagemEmUso: string = body.imagem_url;

    for (const imagemUrl of [
      "https://exemplo.com/foto.png",
      pendenteDeOutroTenant,
      imagemEmUso,
    ]) {
      await admin
        .put(`/api/v1/produtos/${produto.id}`)
        .send({ imagem_url: imagemUrl })
        .expect(400);
    }
  });

  it("recusa upload pendente que já expirou", async () => {
    const produto = await criarProduto(tenant);
    const pendente = await urlPendente(admin);
    await storageDosTestes().delete(pendente); // simula a regra de expiração

    const resposta = await admin
      .put(`/api/v1/produtos/${produto.id}`)
      .send({ imagem_url: pendente })
      .expect(400);

    expect(resposta.body.message).toMatch(/expirou/);
  });

  it("troca e remoção apagam a imagem anterior do produto", async () => {
    const produto = await criarProduto(tenant);
    const storage = storageDosTestes();

    const primeira: string = (
      await admin
        .put(`/api/v1/produtos/${produto.id}`)
        .send({ imagem_url: await urlPendente(admin) })
        .expect(200)
    ).body.imagem_url;

    const segunda: string = (
      await admin
        .put(`/api/v1/produtos/${produto.id}`)
        .send({ imagem_url: await urlPendente(admin) })
        .expect(200)
    ).body.imagem_url;

    expect(storage.contem(primeira)).toBe(false);
    expect(storage.contem(segunda)).toBe(true);

    await admin
      .put(`/api/v1/produtos/${produto.id}`)
      .send({ imagem_url: null })
      .expect(200);
    expect(storage.contem(segunda)).toBe(false);
  });

  it("se o save falhar depois da promoção, a cópia definitiva é apagada", async () => {
    const usuarioExistente = await criarUsuario(tenant, [UserRole.GARCOM]);
    const pendente = await urlPendente(admin);
    const definitiva = pendente.replace("/pendentes/", "/");

    await admin
      .post("/api/v1/usuarios")
      .send({
        nome: "E-mail repetido",
        email: usuarioExistente.email,
        senha: SENHA_PADRAO,
        roles: [UserRole.GARCOM],
        foto_url: pendente,
      })
      .expect(409);

    expect(storageDosTestes().contem(definitiva)).toBe(false);
  });

  it("aceita reenviar a URL que o produto já tinha antes do R2", async () => {
    const produto = await criarProduto(tenant);
    const urlAntiga = "http://localhost:3000/uploads/antiga.png";
    await AppDataSource.getRepository(Product).update(produto.id, {
      imagemUrl: urlAntiga,
    });

    await admin
      .put(`/api/v1/produtos/${produto.id}`)
      .send({ nome: "Nome novo", imagem_url: urlAntiga })
      .expect(200);
  });
});
