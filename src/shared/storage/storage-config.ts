import { normalizarUrlBase } from "./object-key";

export interface R2StorageConfig {
  driver: "r2";
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrlBase: string;
}

export interface MemoriaStorageConfig {
  driver: "memoria";
  publicUrlBase: string;
}

export type StorageConfig = R2StorageConfig | MemoriaStorageConfig;

/** Base pública fictícia do driver em memória (só existe nos testes). */
export const URL_BASE_MEMORIA = "https://storage.teste.local";

type Ambiente = Record<string, string | undefined>;

const VARIAVEIS_R2 = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_PUBLIC_URL_BASE",
] as const;

const FORMATO_ACCOUNT_ID = /^[0-9a-f]{32}$/;

function lerAccountId(valor: string): string {
  if (FORMATO_ACCOUNT_ID.test(valor)) {
    return valor;
  }

  const dica = valor.includes("r2.cloudflarestorage.com")
    ? " Informe só o ID, não o endpoint inteiro: o trecho entre https:// e .r2.cloudflarestorage.com."
    : "";

  throw new Error(
    `R2_ACCOUNT_ID inválido: esperado o Account ID da Cloudflare (32 caracteres hexadecimais).${dica}`,
  );
}

function lerUrlBasePublica(valor: string): string {
  let url: URL;

  try {
    url = new URL(valor);
  } catch {
    throw new Error(`R2_PUBLIC_URL_BASE inválida: "${valor}".`);
  }

  if (url.protocol !== "https:") {
    throw new Error("R2_PUBLIC_URL_BASE precisa usar https.");
  }

  return normalizarUrlBase(valor);
}

/**
 * Lê e valida a configuração do storage. Lança Error com a lista do que falta,
 * para a API recusar subir em vez de falhar só no primeiro upload.
 *
 * - `r2` (padrão): Cloudflare R2; exige todas as variáveis R2_*.
 * - `memoria`: só para a suíte de testes (NODE_ENV=test).
 */
export function lerConfiguracaoStorage(env: Ambiente): StorageConfig {
  const driver = env.STORAGE_DRIVER ?? "r2";

  if (driver === "memoria") {
    if (env.NODE_ENV !== "test") {
      throw new Error(
        'STORAGE_DRIVER="memoria" só pode ser usado com NODE_ENV=test.',
      );
    }

    return { driver: "memoria", publicUrlBase: URL_BASE_MEMORIA };
  }

  if (driver !== "r2") {
    throw new Error(
      `STORAGE_DRIVER="${driver}" não é suportado. Use "r2" (ou "memoria" nos testes).`,
    );
  }

  const faltando = VARIAVEIS_R2.filter((nome) => !env[nome]?.trim());

  if (faltando.length > 0) {
    throw new Error(
      `Armazenamento de imagens (R2) sem configuração: ${faltando.join(", ")}.`,
    );
  }

  // Os valores existem: o filtro acima garante.
  const valor = (nome: (typeof VARIAVEIS_R2)[number]): string =>
    (env[nome] ?? "").trim();

  return {
    driver: "r2",
    accountId: lerAccountId(valor("R2_ACCOUNT_ID")),
    accessKeyId: valor("R2_ACCESS_KEY_ID"),
    secretAccessKey: valor("R2_SECRET_ACCESS_KEY"),
    bucket: valor("R2_BUCKET"),
    publicUrlBase: lerUrlBasePublica(valor("R2_PUBLIC_URL_BASE")),
  };
}
