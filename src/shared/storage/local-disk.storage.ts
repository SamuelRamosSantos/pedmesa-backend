import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { StorageService, UploadFileInput } from "./storage.types";

// Caminho no sistema de arquivos onde os arquivos são gravados. resolve() lida com
// os dois casos: valor relativo (ex.: "uploads", padrão em dev — resolvido a partir
// do diretório de trabalho do processo) ou absoluto (ex.: "/data/uploads", quando é
// um volume persistente montado no container em produção). Importante: NÃO trocar
// por path.join(process.cwd(), UPLOADS_DIR) — join() não descarta o cwd quando o
// segundo argumento já é absoluto, então um valor absoluto viraria um subcaminho
// aninhado errado dentro do cwd.
export const UPLOADS_DIR = resolve(process.env.UPLOADS_DIR ?? "uploads");

// Prefixo da rota pública que serve esses arquivos (ver server.ts) — sempre fixo,
// independente de onde o arquivo realmente está gravado no disco.
export const UPLOADS_URL_PREFIX = "/uploads";

const PUBLIC_URL_BASE = (process.env.PUBLIC_URL_BASE ?? `http://localhost:${process.env.PORT ?? 3000}`).replace(
  /\/$/,
  ""
);

export class LocalDiskStorageService implements StorageService {
  async upload({ buffer, extension }: UploadFileInput): Promise<string> {
    const fileName = `${randomUUID()}.${extension}`;

    await mkdir(UPLOADS_DIR, { recursive: true });
    await writeFile(join(UPLOADS_DIR, fileName), buffer);

    return `${PUBLIC_URL_BASE}${UPLOADS_URL_PREFIX}/${fileName}`;
  }
}
