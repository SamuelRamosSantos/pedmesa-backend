import { fromCents, toCents } from "../../../shared/utils/money";

export interface ExtratoItemInput {
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
  integranteId: string | null;
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
  produto: string;
  qtd: number;
  preco_unitario: number;
  subtotal: number;
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
}

export function calcularExtrato(input: ExtratoCalculatorInput): ExtratoCalculado {
  const quantidadeIntegrantes = input.integrantes.length;

  let totalIndividualCents = 0;
  let totalCompartilhadoCents = 0;

  const linhasPorIntegrante = new Map<string, ExtratoItemLinha[]>();

  for (const item of input.itens) {
    const precoUnitarioCents = toCents(item.precoUnitario);
    const subtotalCents = item.quantidade * precoUnitarioCents;

    const linha: ExtratoItemLinha = {
      produto: item.produtoNome,
      qtd: item.quantidade,
      preco_unitario: fromCents(precoUnitarioCents),
      subtotal: fromCents(subtotalCents),
    };

    if (item.integranteId === null) {
      totalCompartilhadoCents += subtotalCents;
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

  return {
    resumo_financeiro: {
      total_itens_individuais: fromCents(totalIndividualCents),
      total_itens_compartilhados: fromCents(totalCompartilhadoCents),
      quantidade_integrantes: quantidadeIntegrantes,
      valor_compartilhado_por_pessoa: fromCents(valorCompartilhadoPorPessoaCents),
      valor_total_comanda: fromCents(valorTotalComandaCents),
    },
    divisao_por_integrante: divisaoPorIntegrante,
  };
}
