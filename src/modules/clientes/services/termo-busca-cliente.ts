// Interpretação do termo da busca única de clientes (PED-122): o atendente digita um
// nome ou um telefone, com ou sem máscara, no mesmo campo.

export type TermoBuscaCliente =
  | { tipo: "todos" }
  | { tipo: "telefone"; digitos: string }
  // Palavras já sem acento e em minúsculas; o nome precisa conter todas, em qualquer
  // ordem ("maria silva" acha "Maria da Silva").
  | { tipo: "nome"; palavras: string[] };

// Caracteres que aparecem num telefone digitado com máscara: "(11) 98765-4321", "+55 11".
const MASCARA_TELEFONE = /[\s()+\-.]/g;

// Limita os filtros da consulta mesmo que alguém cole um texto enorme no campo.
const MAX_PALAVRAS = 5;

export function interpretarTermoBusca(termo: string | null): TermoBuscaCliente {
  const limpo = (termo ?? "").trim().replace(/\s+/g, " ");

  if (limpo === "") {
    return { tipo: "todos" };
  }

  const semMascara = limpo.replace(MASCARA_TELEFONE, "");

  if (/^\d+$/.test(semMascara)) {
    return { tipo: "telefone", digitos: semMascara };
  }

  const palavras = [...new Set(normalizarParaBusca(limpo).split(" "))];

  return { tipo: "nome", palavras: palavras.slice(0, MAX_PALAVRAS) };
}

// Pares usados pelo translate() do Postgres para comparar sem acento (sem depender da
// extensão unaccent). Maiúsculas acentuadas viram maiúsculas sem acento e o lower()
// aplicado depois cuida do resto, mesmo em banco com locale "C".
export const LETRAS_ACENTUADAS =
  "áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ";
export const LETRAS_SEM_ACENTO =
  "aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN";

// O mesmo que o SQL faz com o nome, aplicado ao termo do lado da aplicação.
export function normalizarParaBusca(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

// Padrão de LIKE "contém", com %, _ e \ do usuário tratados como texto literal (a barra
// é o caractere de escape padrão do LIKE no Postgres).
export function padraoContem(texto: string): string {
  return `%${texto.replace(/[\\%_]/g, (caractere) => `\\${caractere}`)}%`;
}
