import { normalizarLocalidade } from "../localidade-normalizer";
import { CotacaoFrete, EnderecoFrete } from "./calculadora-frete";

export interface TaxaCandidata {
  cidadeNormalizada: string;
  bairroNormalizado: string;
  valor: number;
  tempoEstimadoMin: number | null;
  ativo: boolean;
}

// Decide o frete por bairro (sem banco). Ordem:
// 1. taxa ativa do bairro (comparação normalizada: acento, caixa e espaços não importam);
// 2. taxa padrão do tenant, quando o bairro não tem taxa ou a taxa está desativada;
// 3. sem taxa padrão (null), o bairro não é atendido.
export function resolverTaxa(
  taxas: readonly TaxaCandidata[],
  endereco: EnderecoFrete,
  taxaPadrao: number | null
): CotacaoFrete {
  const cidade = normalizarLocalidade(endereco.cidade);
  const bairro = normalizarLocalidade(endereco.bairro);

  const taxaDoBairro = taxas.find(
    (taxa) => taxa.ativo && taxa.cidadeNormalizada === cidade && taxa.bairroNormalizado === bairro
  );

  if (taxaDoBairro) {
    return { atendido: true, valor: taxaDoBairro.valor, tempoEstimadoMin: taxaDoBairro.tempoEstimadoMin, origem: "bairro" };
  }

  if (taxaPadrao !== null) {
    return { atendido: true, valor: taxaPadrao, tempoEstimadoMin: null, origem: "padrao" };
  }

  return {
    atendido: false,
    motivo: `O bairro ${endereco.bairro.trim()} (${endereco.cidade.trim()}) não é atendido pelo delivery.`,
  };
}
