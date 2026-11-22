import { describe, expect, it } from "vitest";
import { lerConfiguracaoStorage, URL_BASE_MEMORIA } from "./storage-config";

const ACCOUNT_ID = "0123456789abcdef0123456789abcdef";

const R2_COMPLETO = {
  R2_ACCOUNT_ID: ACCOUNT_ID,
  R2_ACCESS_KEY_ID: "chave",
  R2_SECRET_ACCESS_KEY: "segredo",
  R2_BUCKET: "pedmesa-imagens-dev",
  R2_PUBLIC_URL_BASE: "https://cdn-dev.pedmesa.com.br/",
};

describe("lerConfiguracaoStorage", () => {
  it("usa o R2 por padrão e normaliza a URL pública", () => {
    expect(lerConfiguracaoStorage(R2_COMPLETO)).toEqual({
      driver: "r2",
      accountId: ACCOUNT_ID,
      accessKeyId: "chave",
      secretAccessKey: "segredo",
      bucket: "pedmesa-imagens-dev",
      publicUrlBase: "https://cdn-dev.pedmesa.com.br",
    });
  });

  it("recusa o endpoint inteiro no lugar do Account ID, com a dica do formato", () => {
    expect(() =>
      lerConfiguracaoStorage({
        ...R2_COMPLETO,
        R2_ACCOUNT_ID: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
      }),
    ).toThrow(/só o ID, não o endpoint inteiro/);

    expect(() =>
      lerConfiguracaoStorage({ ...R2_COMPLETO, R2_ACCOUNT_ID: "conta" }),
    ).toThrow(/32 caracteres hexadecimais/);
  });

  it("lista todas as variáveis do R2 que faltam", () => {
    expect(() =>
      lerConfiguracaoStorage({ R2_BUCKET: "pedmesa-imagens" }),
    ).toThrow(
      /R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL_BASE/,
    );
  });

  it("exige https na URL pública", () => {
    expect(() =>
      lerConfiguracaoStorage({
        ...R2_COMPLETO,
        R2_PUBLIC_URL_BASE: "http://cdn.pedmesa.com.br",
      }),
    ).toThrow(/https/);
  });

  it("aceita o driver em memória só em teste", () => {
    expect(
      lerConfiguracaoStorage({ STORAGE_DRIVER: "memoria", NODE_ENV: "test" }),
    ).toEqual({ driver: "memoria", publicUrlBase: URL_BASE_MEMORIA });

    expect(() =>
      lerConfiguracaoStorage({
        STORAGE_DRIVER: "memoria",
        NODE_ENV: "production",
      }),
    ).toThrow(/NODE_ENV=test/);
  });

  it("recusa drivers desconhecidos, inclusive o antigo disco local", () => {
    expect(() => lerConfiguracaoStorage({ STORAGE_DRIVER: "local" })).toThrow(
      /não é suportado/,
    );
  });
});
