import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { AppError } from "../errors/app-error";
import type { StorageService, UploadFileInput } from "./storage.types";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new AppError(`Variável de ambiente ${name} não configurada para armazenamento S3.`, 500);
  }

  return value;
}

export class S3StorageService implements StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrlBase: string;

  constructor() {
    this.bucket = getRequiredEnv("S3_BUCKET");
    this.publicUrlBase = getRequiredEnv("S3_PUBLIC_URL_BASE").replace(/\/$/, "");

    this.client = new S3Client({
      region: process.env.S3_REGION ?? "auto",
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      credentials: {
        accessKeyId: getRequiredEnv("S3_ACCESS_KEY_ID"),
        secretAccessKey: getRequiredEnv("S3_SECRET_ACCESS_KEY"),
      },
    });
  }

  async upload({ buffer, mimeType, extension }: UploadFileInput): Promise<string> {
    const key = `${randomUUID()}.${extension}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    );

    return `${this.publicUrlBase}/${key}`;
  }
}
