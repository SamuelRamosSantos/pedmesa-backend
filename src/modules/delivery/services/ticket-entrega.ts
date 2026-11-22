import { fromCents, toCents } from "../../../shared/utils/money";
import { DescontoInput } from "../../comandas/services/desconto-calculator";
import { ExtratoCalculado } from "../../comandas/services/extrato-calculator";
import { calcularTotalComEntrega } from "../../comandas/services/total-com-entrega-calculator";
import { itensDoExtratoParaImpressao } from "../../impressao/formatters/itens-do-extrato";
import { EntregaJobPayload } from "../../impressao/types/print-job.types";
import { Entrega } from "../entities/entrega.entity";
import { descontoParaExibicao } from "./painel-entrega";
import { calcularTroco } from "./troco-calculator";

export type EntregaParaTicket = Pick<
  Entrega,
  | "tenantId"
  | "comandaId"
  | "numeroEntrega"
  | "enderecoCep"
  | "enderecoLogradouro"
  | "enderecoNumero"
  | "enderecoComplemento"
  | "enderecoBairro"
  | "enderecoCidade"
  | "enderecoUf"
  | "enderecoReferencia"
  | "formaPagamentoPrevista"
  | "trocoPara"
  | "taxaIsenta"
>;

// Monta o cupom do motoboy a partir da entrega (snapshot do endereço) e do extrato ATUAL
// da comanda: se itens mudaram depois da criação, o cupom sai com os valores de agora, e o
// troco é recalculado (se o "troco para" não cobrir mais o total, sai com troco 0).
// Total = itens − desconto + taxa, o mesmo do painel e do fechamento (PED-126).
export function montarJobEntrega(
  entrega: EntregaParaTicket,
  cliente: { nome: string; telefone: string },
  calculado: ExtratoCalculado,
  desconto: DescontoInput,
  geradoEm: Date,
): EntregaJobPayload {
  const subtotal = calculado.resumo_financeiro.valor_total_comanda;
  const totais = calcularTotalComEntrega(
    subtotal,
    descontoParaExibicao(desconto.tipo, desconto.valor, subtotal),
    calculado.resumo_financeiro.taxa_entrega,
  );
  const troco = calcularTroco({
    totalCents: toCents(totais.total_final),
    formaPrevista: entrega.formaPagamentoPrevista,
    trocoParaCents:
      entrega.trocoPara === null ? null : toCents(entrega.trocoPara),
  });

  return {
    tenant_id: entrega.tenantId,
    comanda_id: entrega.comandaId,
    numero_entrega: entrega.numeroEntrega,
    gerado_em: geradoEm,
    itens: itensDoExtratoParaImpressao(calculado),
    dados: {
      cliente_nome: cliente.nome,
      cliente_telefone: cliente.telefone,
      endereco: {
        cep: entrega.enderecoCep,
        logradouro: entrega.enderecoLogradouro,
        numero: entrega.enderecoNumero,
        complemento: entrega.enderecoComplemento,
        bairro: entrega.enderecoBairro,
        cidade: entrega.enderecoCidade,
        uf: entrega.enderecoUf,
        referencia: entrega.enderecoReferencia,
      },
      subtotal: totais.subtotal,
      desconto: totais.desconto_aplicado,
      taxa_entrega: totais.taxa_entrega,
      taxa_isenta: entrega.taxaIsenta,
      total: totais.total_final,
      forma_pagamento: entrega.formaPagamentoPrevista,
      troco_para: entrega.trocoPara,
      troco: fromCents(troco.trocoCents),
    },
  };
}
