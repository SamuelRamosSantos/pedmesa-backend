import { MemoriaStorageService } from "./memoria.storage";
import { R2StorageService } from "./r2.storage";
import type { StorageService } from "./storage.types";
import { lerConfiguracaoStorage } from "./storage-config";
import { uploadPendenteInvalido } from "./storage-erros";

let servicoEmCache: StorageService | null = null;

/**
 * Devolve o storage configurado (R2 por padrão; memória nos testes). A primeira
 * chamada valida as variáveis de ambiente e lança erro se faltar alguma — o
 * server.ts chama esta função antes do listen para a API nem subir sem storage.
 */
export function getStorageService(): StorageService {
  if (!servicoEmCache) {
    const config = lerConfiguracaoStorage(process.env);

    servicoEmCache =
      config.driver === "memoria"
        ? new MemoriaStorageService(config.publicUrlBase)
        : new R2StorageService(config);
  }

  return servicoEmCache;
}

/**
 * Prepara a imagem nova de um cadastro: só aceita `null` ou um upload pendente do
 * próprio tenant (enviado por POST /uploads) e o promove para a pasta definitiva,
 * devolvendo a URL que deve ser gravada no banco. Bloqueia links externos, a
 * imagem de outro estabelecimento e o reaproveitamento de uma imagem já em uso.
 *
 * Se o save do cadastro falhar depois disto, chame `removerImagemSemFalhar` com a
 * URL devolvida para não deixar a cópia definitiva órfã.
 */
export async function prepararNovaImagem(
  url: string | null,
  tenantId: string,
): Promise<string | null> {
  if (url === null) {
    return null;
  }

  const storage = getStorageService();

  if (!storage.ehUploadPendenteDoTenant(url, tenantId)) {
    throw uploadPendenteInvalido();
  }

  return storage.promover(url, tenantId);
}

/**
 * Apaga uma imagem que deixou de ser usada. Roda depois do commit e nunca
 * derruba a operação principal: se o storage falhar, o arquivo vira órfão e o
 * erro fica no log.
 */
export async function removerImagemSemFalhar(
  url: string | null | undefined,
): Promise<void> {
  if (!url) {
    return;
  }

  try {
    await getStorageService().delete(url);
  } catch (error) {
    console.error(`[STORAGE] Não foi possível apagar ${url}:`, error);
  }
}
