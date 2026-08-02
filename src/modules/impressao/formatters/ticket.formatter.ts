import { PrintJobItemPayload, PrintJobPayload } from "../types/print-job.types";

const LARGURA_CUPOM = "================================";
const SEPARADOR_ITEM = "--------------------------------";

function formatarCabecalho(job: PrintJobPayload): string {
  const horario = job.criado_em.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  return [
    "[ESC/POS] INIT",
    LARGURA_CUPOM,
    "        COZINHA - PEDIDO       ",
    LARGURA_CUPOM,
    `Comanda/Mesa: #${job.numero_comanda}`,
    `Horário do Pedido: ${horario}`,
    `Pedido: #${job.pedido_id}`,
    SEPARADOR_ITEM,
  ].join("\n");
}

function formatarItem(item: PrintJobItemPayload): string {
  const linhas = [`${item.quantidade}x ${item.produto_nome}`];

  linhas.push(item.integrante_nome ? `  Para: ${item.integrante_nome}` : "  [COMPARTILHADO]");

  if (item.observacao) {
    linhas.push(`  Obs: ${item.observacao}`);
  }

  return linhas.join("\n");
}

export function formatarTicket(job: PrintJobPayload): string {
  const corpo = job.itens.map(formatarItem).join(`\n${SEPARADOR_ITEM}\n`);

  return [formatarCabecalho(job), corpo, LARGURA_CUPOM, "[ESC/POS] CUT"].join("\n");
}
