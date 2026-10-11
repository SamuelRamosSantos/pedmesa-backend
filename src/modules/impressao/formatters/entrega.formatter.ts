import { EntregaJobPayload, PrintJobItemPayload } from "../types/print-job.types";
import { formatarCep, formatarMoeda, formatarTelefone, identificacaoDoPedido } from "./formatacao";

// Cupom do motoboy (PED-102). Portado 1:1 em pedmesa-print-agent/src/print/entrega-formatter.js:
// ao mudar aqui, mude lá no mesmo commit.

const LARGURA_CUPOM = "================================";
const SEPARADOR_ITEM = "--------------------------------";

const ROTULO_FORMA_PAGAMENTO: Record<string, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
};

function formatarItem(item: PrintJobItemPayload): string {
  const linhas = [`${item.quantidade}x ${item.produto_nome} - ${formatarMoeda(item.subtotal)}`];

  if (item.observacao) {
    linhas.push(`  Obs: ${item.observacao}`);
  }

  return linhas.join("\n");
}

function formatarEndereco(job: EntregaJobPayload): string[] {
  const { endereco } = job.dados;
  const linhaRua = `${endereco.logradouro}, ${endereco.numero}${endereco.complemento ? ` - ${endereco.complemento}` : ""}`;
  const linhas = [
    "ENDEREÇO",
    linhaRua,
    `${endereco.bairro} - ${endereco.cidade}/${endereco.uf}`,
    `CEP ${formatarCep(endereco.cep)}`,
  ];

  if (endereco.referencia) {
    linhas.push(`Ref.: ${endereco.referencia}`);
  }

  return linhas;
}

function formatarPagamento(job: EntregaJobPayload): string[] {
  const { dados } = job;
  const linhas = [`Pagamento: ${ROTULO_FORMA_PAGAMENTO[dados.forma_pagamento] ?? dados.forma_pagamento}`];

  if (dados.troco_para !== null) {
    linhas.push(`Troco para: ${formatarMoeda(dados.troco_para)}`);
    linhas.push(`LEVAR TROCO: ${formatarMoeda(dados.troco)}`);
  }

  return linhas;
}

export function formatarEntrega(job: EntregaJobPayload): string {
  const horario = job.gerado_em.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const { dados } = job;

  return [
    "[ESC/POS] INIT",
    LARGURA_CUPOM,
    "       ENTREGA - DELIVERY      ",
    LARGURA_CUPOM,
    identificacaoDoPedido(null, job.numero_entrega),
    `Emitido em: ${horario}`,
    SEPARADOR_ITEM,
    `Cliente: ${dados.cliente_nome}`,
    `Tel: ${formatarTelefone(dados.cliente_telefone)}`,
    SEPARADOR_ITEM,
    ...formatarEndereco(job),
    SEPARADOR_ITEM,
    job.itens.map(formatarItem).join("\n"),
    SEPARADOR_ITEM,
    `Subtotal: ${formatarMoeda(dados.subtotal)}`,
    `Taxa de entrega: ${formatarMoeda(dados.taxa_entrega)}`,
    `TOTAL: ${formatarMoeda(dados.total)}`,
    SEPARADOR_ITEM,
    ...formatarPagamento(job),
    LARGURA_CUPOM,
    "[ESC/POS] CUT",
  ].join("\n");
}
