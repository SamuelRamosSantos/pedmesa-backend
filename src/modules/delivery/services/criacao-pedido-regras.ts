import { AppError } from "../../../shared/errors/app-error";
import { toCents } from "../../../shared/utils/money";
import { FormaPagamento } from "../../comandas/entities/pagamento-comanda.entity";
import { StatusPreparo } from "../../pedidos/entities/pedido.entity";
import { StatusEntrega } from "../entities/entrega.entity";
import { CotacaoPedido } from "./cotacao-pedido";
import { assertTrocoValidoNaCriacao } from "./troco-calculator";

// A cotação só sinaliza; a criação recusa (PED-96). Mensagens prontas para o atendente.
export function assertCotacaoPermiteCriacao(
  cotacao: CotacaoPedido,
  formaPagamento: FormaPagamento,
  trocoParaCents: number | null
): void {
  if (!cotacao.atendido) {
    throw new AppError(cotacao.motivoNaoAtendido ?? "O endereço não é atendido pelo delivery.", 400);
  }

  if (!cotacao.pedidoMinimoAtingido) {
    throw new AppError(
      `O pedido mínimo para delivery é R$ ${cotacao.pedidoMinimo.toFixed(2)}; os itens somam R$ ${cotacao.subtotal.toFixed(2)}.`,
      400
    );
  }

  assertTrocoValidoNaCriacao({ totalCents: toCents(cotacao.total), formaPrevista: formaPagamento, trocoParaCents });
}

// Entrega nasce "pronto para envio" quando nada precisa de cozinha (itens que não precisam
// de preparo, ou tenant sem módulo de cozinha). Senão, "em produção".
export function statusInicialDaEntrega(statusPreparoDoPedido: StatusPreparo): StatusEntrega {
  return statusPreparoDoPedido === StatusPreparo.PRONTO || statusPreparoDoPedido === StatusPreparo.ENTREGUE
    ? StatusEntrega.PRONTO_PARA_ENVIO
    : StatusEntrega.EM_PRODUCAO;
}

export function calcularPrevisaoEntrega(agora: Date, tempoEstimadoMin: number | null): Date | null {
  return tempoEstimadoMin === null ? null : new Date(agora.getTime() + tempoEstimadoMin * 60_000);
}
