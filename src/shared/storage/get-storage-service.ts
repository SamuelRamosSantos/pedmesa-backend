import { LocalDiskStorageService } from "./local-disk.storage";
import { S3StorageService } from "./s3.storage";
import type { StorageService } from "./storage.types";

let cachedService: StorageService | null = null;

// Driver escolhido via env (STORAGE_DRIVER=s3 em produção, "local" por padrão em
// dev) — instanciado sob demanda (e cacheado) para não exigir credenciais S3
// configuradas em ambientes que usam disco local.
export function getStorageService(): StorageService {
  if (!cachedService) {
    cachedService = process.env.STORAGE_DRIVER === "s3" ? new S3StorageService() : new LocalDiskStorageService();
  }

  return cachedService;
}
