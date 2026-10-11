import { ExtratoCalculado } from "../../comandas/services/extrato-calculator";
import { PrintJobItemPayload } from "../types/print-job.types";

// Itens de um extrato no formato dos cupons (pré-conta e entrega): primeiro os
// individuais de cada integrante, depois os compartilhados.
export function itensDoExtratoParaImpressao(calculado: ExtratoCalculado): PrintJobItemPayload[] {
  return [
    ...calculado.divisao_por_integrante.flatMap((integrante) =>
      integrante.itens_individuais.map(
        (item): PrintJobItemPayload => ({
          produto_nome: item.produto,
          quantidade: item.qtd,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal,
          integrante_nome: integrante.nome,
          observacao: null,
        })
      )
    ),
    ...calculado.itens_compartilhados.map(
      (item): PrintJobItemPayload => ({
        produto_nome: item.produto,
        quantidade: item.qtd,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal,
        integrante_nome: null,
        observacao: null,
      })
    ),
  ];
}
