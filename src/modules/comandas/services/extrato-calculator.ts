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
  valor_total_comanda: number;
}

export interface ExtratoCalculado {
  resumo_financeiro: ResumoFinanceiro;
  divisao_por_integrante: ExtratoIntegranteResultado[];
  itens_compartilhados: ExtratoItemCompartilhadoLinha[];
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

  for (const item of input.itens) {
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
    },
    divisao_por_integrante: divisaoPorIntegrante,
    itens_compartilhados: itensCompartilhados,
    itens_pendentes_entrega: itensPendentes.length,
    possui_itens_pendentes: itensPendentes.length > 0,
    itens_pendentes: itensPendentes,
  };
}
