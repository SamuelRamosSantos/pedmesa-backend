import { PreContaJobPayload, PrintJobItemPayload } from "../types/print-job.types";

const LARGURA_CUPOM = "================================";
const SEPARADOR_ITEM = "--------------------------------";

function formatarMoeda(valor: number): string {
  return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

function formatarCabecalho(job: PreContaJobPayload): string {
  const horario = job.gerado_em.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  return [
    "[ESC/POS] INIT",
    LARGURA_CUPOM,
    "      PRÉ-CONTA (NÃO FISCAL)   ",
    "   apenas conferência de consumo",
    LARGURA_CUPOM,
    `Comanda/Mesa: #${job.numero_comanda}`,
    `Emitido em: ${horario}`,
    SEPARADOR_ITEM,
  ].join("\n");
}

function formatarItem(item: PrintJobItemPayload): string {
  const linhas = [`${item.quantidade}x ${item.produto_nome} - ${formatarMoeda(item.subtotal)}`];

  linhas.push(item.integrante_nome ? `  Para: ${item.integrante_nome}` : "  [COMPARTILHADO]");

  return linhas.join("\n");
}

export function formatarPreConta(job: PreContaJobPayload): string {
  const corpo = job.itens.map(formatarItem).join(`\n${SEPARADOR_ITEM}\n`);

  return [
    formatarCabecalho(job),
    corpo,
    SEPARADOR_ITEM,
    `TOTAL: ${formatarMoeda(job.valor_total)}`,
    LARGURA_CUPOM,
    "Este cupom não possui valor fiscal.",
    "Aguarde o fechamento no caixa.",
    "[ESC/POS] CUT",
  ].join("\n");
}
