import { AppError } from "../../../shared/errors/app-error";
import { fromCents } from "../../../shared/utils/money";
import { FormaPagamento } from "../../comandas/entities/pagamento-comanda.entity";

// Limite de sanidade do troco na criação do pedido: evita que um "troco para R$ 1000"
// digitado no lugar de "R$ 100" chegue ao entregador.
export const TROCO_MAXIMO_CENTS = 50_000;

export interface CalcularTrocoParams {
  totalCents: number;
  formaPrevista: FormaPagamento;
  // null: o cliente paga o valor exato (ou não paga em dinheiro).
  trocoParaCents: number | null;
}

export interface TrocoCalculado {
  trocoCents: number;
  suficiente: boolean;
}

function assertCentavosInteiros(valor: number, campo: string): void {
  if (!Number.isInteger(valor) || valor < 0) {
    // Erro de programação: os chamadores devem converter reais com toCents antes.
    throw new Error(`${campo} deve ser um inteiro de centavos não negativo (recebido: ${valor}).`);
  }
}

// Troco que o entregador precisa levar. Não persiste nada: é recalculado sempre que o
// total muda. Com troco_para menor que o total, devolve suficiente: false e troco 0;
// quem decide se isso bloqueia (criação) ou só sinaliza (painel, ticket) é o chamador.
export function calcularTroco({ totalCents, formaPrevista, trocoParaCents }: CalcularTrocoParams): TrocoCalculado {
  assertCentavosInteiros(totalCents, "totalCents");

  if (trocoParaCents === null) {
    return { trocoCents: 0, suficiente: true };
  }

  assertCentavosInteiros(trocoParaCents, "trocoParaCents");

  if (formaPrevista !== FormaPagamento.DINHEIRO) {
    throw new AppError("Troco só pode ser informado para pagamento em dinheiro.", 400);
  }

  if (trocoParaCents < totalCents) {
    return { trocoCents: 0, suficiente: false };
  }

  return { trocoCents: trocoParaCents - totalCents, suficiente: true };
}

// Regras extras da criação do pedido: troco insuficiente e troco acima do limite são
// recusados. Em leituras posteriores use calcularTroco, que apenas sinaliza.
export function assertTrocoValidoNaCriacao(params: CalcularTrocoParams): TrocoCalculado {
  const troco = calcularTroco(params);

  if (!troco.suficiente) {
    throw new AppError(
      `O valor para troco (R$ ${fromCents(params.trocoParaCents ?? 0).toFixed(2)}) é menor que o total do pedido (R$ ${fromCents(
        params.totalCents
      ).toFixed(2)}).`,
      400
    );
  }

  if (troco.trocoCents > TROCO_MAXIMO_CENTS) {
    throw new AppError(
      `O troco calculado (R$ ${fromCents(troco.trocoCents).toFixed(2)}) passa do limite de R$ ${fromCents(
        TROCO_MAXIMO_CENTS
      ).toFixed(2)}. Confira o valor informado para troco.`,
      400
    );
  }

  return troco;
}
