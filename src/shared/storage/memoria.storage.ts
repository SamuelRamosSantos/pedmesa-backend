import { randomUUID } from "node:crypto";
import {
  chaveDefinitiva,
  ehUploadPendenteDoTenant,
  interpretarUrl,
  montarChavePendente,
  montarUrlPublica,
} from "./object-key";
import type { StorageService, UploadFileInput } from "./storage.types";
import { uploadExpirado, uploadPendenteInvalido } from "./storage-erros";

interface ObjetoArmazenado {
  buffer: Buffer;
  mimeType: string;
}

/**
 * Storage em memória para a suíte de testes (STORAGE_DRIVER=memoria, só com
 * NODE_ENV=test). Segue as mesmas regras de chave, URL e promoção do R2, e os
 * testes podem conferir o que foi gravado ou apagado sem acesso à rede.
 */
export class MemoriaStorageService implements StorageService {
  readonly objetos = new Map<string, ObjetoArmazenado>();

  constructor(private readonly publicUrlBase: string) {}

  async upload({
    tenantId,
    buffer,
    mimeType,
    extension,
  }: UploadFileInput): Promise<string> {
    const chave = montarChavePendente(tenantId, randomUUID(), extension);
    this.objetos.set(chave, { buffer, mimeType });

    return montarUrlPublica(this.publicUrlBase, chave);
  }

  async promover(urlPendente: string, tenantId: string): Promise<string> {
    const origem = interpretarUrl(urlPendente, this.publicUrlBase);

    if (!origem || !this.ehUploadPendenteDoTenant(urlPendente, tenantId)) {
      throw uploadPendenteInvalido();
    }

    const objeto = this.objetos.get(origem.chave);

    if (!objeto) {
      throw uploadExpirado();
    }

    const destino = chaveDefinitiva(origem.chave);
    this.objetos.set(destino, objeto);
    this.objetos.delete(origem.chave);

    return montarUrlPublica(this.publicUrlBase, destino);
  }

  async delete(url: string): Promise<void> {
    const objeto = interpretarUrl(url, this.publicUrlBase);

    if (objeto) {
      this.objetos.delete(objeto.chave);
    }
  }

  ehUploadPendenteDoTenant(url: string, tenantId: string): boolean {
    return ehUploadPendenteDoTenant(url, this.publicUrlBase, tenantId);
  }

  contem(url: string): boolean {
    const objeto = interpretarUrl(url, this.publicUrlBase);

    return objeto !== null && this.objetos.has(objeto.chave);
  }

  /** Chaves gravadas para o tenant (pendentes e definitivas). */
  chavesDoTenant(tenantId: string): string[] {
    return [...this.objetos.keys()].filter((chave) =>
      chave.includes(`tenants/${tenantId}/`),
    );
  }
}
