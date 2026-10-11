// Contrato da cotação de frete (Strategy, PED-93). O caso de uso (cotação e criação do
// pedido delivery) só conhece esta interface; a implementação concreta é escolhida no
// ponto de composição (criarCalculadoraFrete).

export interface EnderecoFrete {
  cidade: string;
  bairro: string;
}

export type CotacaoFrete =
  | { atendido: true; valor: number; tempoEstimadoMin: number | null; origem: "bairro" | "padrao" }
  | { atendido: false; motivo: string };

export interface CalculadoraFrete {
  cotar(tenantId: string, endereco: EnderecoFrete): Promise<CotacaoFrete>;
}
