import { randomUUID } from "node:crypto";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import {
  chaveDefinitiva,
  ehUploadPendenteDoTenant,
  interpretarUrl,
  montarChavePendente,
  montarUrlPublica,
} from "./object-key";
import type { StorageService, UploadFileInput } from "./storage.types";
import type { R2StorageConfig } from "./storage-config";
import { uploadExpirado, uploadPendenteInvalido } from "./storage-erros";

// O nome de cada arquivo é um UUID novo, então o conteúdo de uma URL nunca muda:
// navegador e CDN podem guardar por 1 ano sem revalidar.
export const CACHE_CONTROL_IMUTAVEL = "public, max-age=31536000, immutable";

/**
 * Cloudflare R2 pela API compatível com S3. O endpoint é derivado da conta e a
 * região é sempre "auto" (exigência do R2). As URLs públicas saem do domínio
 * próprio conectado ao bucket (cdn.pedmesa.com.br / cdn-dev.pedmesa.com.br).
 */
export class R2StorageService implements StorageService {
  private readonly client: S3Client;

  constructor(private readonly config: R2StorageConfig) {
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async upload({
    tenantId,
    buffer,
    mimeType,
    extension,
  }: UploadFileInput): Promise<string> {
    const chave = montarChavePendente(tenantId, randomUUID(), extension);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: chave,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: CACHE_CONTROL_IMUTAVEL,
      }),
    );

    return montarUrlPublica(this.config.publicUrlBase, chave);
  }

  async promover(urlPendente: string, tenantId: string): Promise<string> {
    if (!this.ehUploadPendenteDoTenant(urlPendente, tenantId)) {
      throw uploadPendenteInvalido();
    }

    const origem = interpretarUrl(urlPendente, this.config.publicUrlBase);

    if (!origem) {
      throw uploadPendenteInvalido();
    }

    const destino = chaveDefinitiva(origem.chave);

    try {
      // A cópia leva junto o Content-Type e o Cache-Control do objeto original.
      await this.client.send(
        new CopyObjectCommand({
          Bucket: this.config.bucket,
          Key: destino,
          CopySource: `${this.config.bucket}/${origem.chave}`,
        }),
      );
    } catch (error) {
      if (
        error instanceof S3ServiceException &&
        (error.name === "NoSuchKey" || error.$metadata.httpStatusCode === 404)
      ) {
        throw uploadExpirado();
      }

      throw error;
    }

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: origem.chave,
      }),
    );

    return montarUrlPublica(this.config.publicUrlBase, destino);
  }

  async delete(url: string): Promise<void> {
    const objeto = interpretarUrl(url, this.config.publicUrlBase);

    if (!objeto) {
      return;
    }

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: objeto.chave,
      }),
    );
  }

  ehUploadPendenteDoTenant(url: string, tenantId: string): boolean {
    return ehUploadPendenteDoTenant(url, this.config.publicUrlBase, tenantId);
  }
}
