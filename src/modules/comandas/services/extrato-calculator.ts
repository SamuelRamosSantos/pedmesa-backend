import { StatusItem } from "../../pedidos/entities/item-pedido.entity";
import { fromCents, toCents } from "../../../shared/utils/money";

const STATUS_PENDENTES_ENTREGA: StatusItem[] = [StatusItem.PENDENTE, StatusItem.EM_PREPARO, StatusItem.PRONTO];

export interface ExtratoItemInput {
  id: string;
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
  integranteId: string | null;
  statusItem: StatusItem;
}

export interface ItemPendenteEntrega {
  produto_nome: string;
  quantidade: number;
  status_item: StatusItem;
}

export interface ExtratoIntegranteInput {
  id: string;
  nome: string;
}

export interface ExtratoCalculatorInput {
  itens: ExtratoItemInput[];
  integrantes: ExtratoIntegranteInput[];
  // Taxa de entrega do delivery (snapshot em entregas.taxa_entrega). Ausente ou 0 para mesa.
  taxaEntrega?: number;
}

export interface ExtratoItemLinha {
  id: string;
  produto: string;
  qtd: number;
  preco_unitario: number;
  subtotal: number;
}

export interface ExtratoItemCompartilhadoLinha {
  id: string;
  produto: string;
  qtd: number;
  preco_unitario: number;
  subtotal: number;
  valor_por_pessoa: number;
}

export interface ExtratoIntegranteResultado {
  integrante_id: string;
  nome: string;
  itens_individuais: ExtratoItemLinha[];
  total_individual: number;
  cota_compartilhada: number;
  total_a_pagar: number;
}

export interface ResumoFinanceiro {
  total_itens_individuais: number;
  total_itens_compartilhados: number;
  quantidade_integrantes: number;
  valor_compartilhado_por_pessoa: number;
  // Só os itens: é a base do desconto (ADR-001, decisão 2 do PO: a taxa nunca é descontada).
  valor_total_comanda: number;
  taxa_entrega: number;
  // Itens + taxa de entrega, antes do desconto. Igual a valor_total_comanda para mesa.
  valor_total_com_entrega: number;
}

// Item cancelado: aparece no extrato para conferência, mas não é cobrado.
export interface ExtratoItemCanceladoLinha {
  id: string;
  produto: string;
  qtd: number;
  integrante_id: string | null;
}

export interface ExtratoCalculado {
  resumo_financeiro: ResumoFinanceiro;
  divisao_por_integrante: ExtratoIntegranteResultado[];
  itens_compartilhados: ExtratoItemCompartilhadoLinha[];
  itens_cancelados: ExtratoItemCanceladoLinha[];
  itens_pendentes_entrega: number;
  possui_itens_pendentes: boolean;
  itens_pendentes: ItemPendenteEntrega[];
}

export function calcularExtrato(input: ExtratoCalculatorInput): ExtratoCalculado {
  const quantidadeIntegrantes = input.integrantes.length;

  let totalIndividualCents = 0;
  let totalCompartilhadoCents = 0;

  const linhasPorIntegrante = new Map<string, ExtratoItemLinha[]>();
  const itensCompartilhados: ExtratoItemCompartilhadoLinha[] = [];
  const itensCancelados: ExtratoItemCanceladoLinha[] = [];

  for (const item of input.itens) {
    // Cancelado não é cobrado: fica fora do total, da divisão e da cota compartilhada.
    if (item.statusItem === StatusItem.CANCELADO) {
      itensCancelados.push({ id: item.id, produto: item.produtoNome, qtd: item.quantidade, integrante_id: item.integranteId });
      continue;
    }

    const precoUnitarioCents = toCents(item.precoUnitario);
    const subtotalCents = item.quantidade * precoUnitarioCents;

    const linha: ExtratoItemLinha = {
      id: item.id,
      produto: item.produtoNome,
      qtd: item.quantidade,
      preco_unitario: fromCents(precoUnitarioCents),
      subtotal: fromCents(subtotalCents),
    };

    if (item.integranteId === null) {
      totalCompartilhadoCents += subtotalCents;

      const valorPorPessoaCents = quantidadeIntegrantes > 0 ? Math.round(subtotalCents / quantidadeIntegrantes) : 0;
      itensCompartilhados.push({ ...linha, valor_por_pessoa: fromCents(valorPorPessoaCents) });
      continue;
    }

    totalIndividualCents += subtotalCents;

    const linhasExistentes = linhasPorIntegrante.get(item.integranteId) ?? [];
    linhasExistentes.push(linha);
    linhasPorIntegrante.set(item.integranteId, linhasExistentes);
  }

  const valorCompartilhadoPorPessoaCents =
    quantidadeIntegrantes > 0 ? Math.round(totalCompartilhadoCents / quantidadeIntegrantes) : 0;

  const divisaoPorIntegrante: ExtratoIntegranteResultado[] = input.integrantes.map((integrante) => {
    const itensIndividuais = linhasPorIntegrante.get(integrante.id) ?? [];
    const totalIndividualIntegranteCents = itensIndividuais.reduce(
      (soma, linha) => soma + toCents(linha.subtotal),
      0
    );

    return {
      integrante_id: integrante.id,
      nome: integrante.nome,
      itens_individuais: itensIndividuais,
      total_individual: fromCents(totalIndividualIntegranteCents),
      cota_compartilhada: fromCents(valorCompartilhadoPorPessoaCents),
      total_a_pagar: fromCents(totalIndividualIntegranteCents + valorCompartilhadoPorPessoaCents),
    };
  });

  const valorTotalComandaCents = totalIndividualCents + totalCompartilhadoCents;
  const taxaEntregaCents = toCents(input.taxaEntrega ?? 0);

  const itensPendentes: ItemPendenteEntrega[] = input.itens
    .filter((item) => STATUS_PENDENTES_ENTREGA.includes(item.statusItem))
    .map((item) => ({
      produto_nome: item.produtoNome,
      quantidade: item.quantidade,
      status_item: item.statusItem,
    }));

  return {
    resumo_financeiro: {
      total_itens_individuais: fromCents(totalIndividualCents),
      total_itens_compartilhados: fromCents(totalCompartilhadoCents),
      quantidade_integrantes: quantidadeIntegrantes,
      valor_compartilhado_por_pessoa: fromCents(valorCompartilhadoPorPessoaCents),
      valor_total_comanda: fromCents(valorTotalComandaCents),
      taxa_entrega: fromCents(taxaEntregaCents),
      valor_total_com_entrega: fromCents(valorTotalComandaCents + taxaEntregaCents),
    },
    divisao_por_integrante: divisaoPorIntegrante,
    itens_compartilhados: itensCompartilhados,
    itens_cancelados: itensCancelados,
    itens_pendentes_entrega: itensPendentes.length,
    possui_itens_pendentes: itensPendentes.length > 0,
    itens_pendentes: itensPendentes,
  };
}
