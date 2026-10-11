import { EntityManager } from "typeorm";
import { CalculadoraFrete } from "./calculadora-frete";
import { FretePorBairroCalculator } from "./frete-por-bairro.calculator";

export type { CalculadoraFrete, CotacaoFrete, EnderecoFrete } from "./calculadora-frete";

// Ponto de composição da estratégia de frete. Para trocar (ex.: frete por distância),
// crie outra classe que implemente CalculadoraFrete e devolva-a aqui; a cotação e a
// criação do pedido não mudam.
export function criarCalculadoraFrete(manager: EntityManager): CalculadoraFrete {
  return new FretePorBairroCalculator(manager);
}
