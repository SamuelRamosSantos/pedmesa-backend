// Funções puras para montar e interpretar as chaves e URLs dos objetos no storage.
//
// - Upload recém-enviado (ainda não salvo em nenhum cadastro):
//     pendentes/tenants/<tenant_id>/<uuid>.<extensão>
//   Uma regra de ciclo de vida no bucket apaga essa pasta depois de 1 dia, então
//   imagem escolhida e nunca salva some sozinha.
// - Imagem em uso (promovida ao salvar o cadastro):
//     tenants/<tenant_id>/<uuid>.<extensão>

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
export const PREFIXO_PENDENTES = "pendentes/";
const FORMATO_CHAVE = new RegExp(
  `^(${PREFIXO_PENDENTES})?tenants/(${UUID})/${UUID}\\.(jpg|png|webp)$`,
);

export interface ChaveInterpretada {
  chave: string;
  tenantId: string;
  pendente: boolean;
}

export function montarChavePendente(
  tenantId: string,
  idArquivo: string,
  extensao: string,
): string {
  return `${PREFIXO_PENDENTES}tenants/${tenantId}/${idArquivo}.${extensao}`;
}

/** Chave definitiva de um upload pendente: a mesma, sem o prefixo "pendentes/". */
export function chaveDefinitiva(chavePendente: string): string {
  return chavePendente.startsWith(PREFIXO_PENDENTES)
    ? chavePendente.slice(PREFIXO_PENDENTES.length)
    : chavePendente;
}

/** Remove a barra final para que base + "/" + chave nunca gere "//". */
export function normalizarUrlBase(urlBase: string): string {
  return urlBase.replace(/\/+$/, "");
}

export function montarUrlPublica(urlBase: string, chave: string): string {
  return `${normalizarUrlBase(urlBase)}/${chave}`;
}

/**
 * Interpreta uma URL do nosso storage. Qualquer outra URL (externa, de outro
 * bucket, com caminho fora do formato) devolve null.
 */
export function interpretarUrl(
  url: string,
  urlBase: string,
): ChaveInterpretada | null {
  const prefixo = `${normalizarUrlBase(urlBase)}/`;

  if (!url.startsWith(prefixo)) {
    return null;
  }

  const chave = url.slice(prefixo.length);
  const partes = FORMATO_CHAVE.exec(chave);

  if (!partes) {
    return null;
  }

  return { chave, tenantId: partes[2], pendente: partes[1] !== undefined };
}

/** A URL é de um upload pendente (ainda não salvo) deste tenant? */
export function ehUploadPendenteDoTenant(
  url: string,
  urlBase: string,
  tenantId: string,
): boolean {
  const interpretada = interpretarUrl(url, urlBase);

  return interpretada?.pendente === true && interpretada.tenantId === tenantId;
}
