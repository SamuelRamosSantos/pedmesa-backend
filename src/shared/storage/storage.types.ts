export interface UploadFileInput {
  tenantId: string;
  buffer: Buffer;
  mimeType: string;
  extension: string;
}

export interface StorageService {
  /**
   * Grava o arquivo em pendentes/tenants/<tenant_id>/<uuid>.<ext> e devolve a URL
   * pública (usada na prévia). Se nunca for salvo num cadastro, a regra de ciclo
   * de vida do bucket apaga o arquivo.
   */
  upload(input: UploadFileInput): Promise<string>;
  /**
   * Move um upload pendente do tenant para tenants/<tenant_id>/<uuid>.<ext> e
   * devolve a URL definitiva. Lança AppError 400 se o upload já expirou.
   */
  promover(urlPendente: string, tenantId: string): Promise<string>;
  /** Apaga o objeto de uma URL do próprio storage; URL de fora é ignorada. */
  delete(url: string): Promise<void>;
  /** A URL é de um upload pendente deste tenant? */
  ehUploadPendenteDoTenant(url: string, tenantId: string): boolean;
}
