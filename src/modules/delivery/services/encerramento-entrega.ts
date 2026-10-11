import { EntityManager, In } from "typeorm";
import { AppError } from "../../../shared/errors/app-error";
import { Comanda } from "../../comandas/entities/comanda.entity";
import { PagamentoComanda } from "../../comandas/entities/pagamento-comanda.entity";
import { cancelarComandaZeradaNaTransacao } from "../../comandas/services/cancelamento-comanda";
import { carregarExtrato } from "../../comandas/services/extrato-loader";
import { fecharComandaNaTransacao } from "../../comandas/services/fechamento-comanda";
import { calcularTotalComEntrega } from "../../comandas/services/total-com-entrega-calculator";
import { ItemPedido, StatusItem } from "../../pedidos/entities/item-pedido.entity";
import { Pedido } from "../../pedidos/entities/pedido.entity";
import { calcularStatusPreparoPedido } from "../../pedidos/services/status-preparo-calculator";
import { Entrega } from "../entities/entrega.entity";

// Encerramento da comanda delivery (PED-100), sempre dentro da transação da transição de
// status (PED-99): se o fechamento falhar, a entrega também não muda de status.

// "Entregue" = recebido e fechado. Sem pagamento registrado, registra um com a forma
// prevista e o VALOR DO TOTAL (nunca o "troco para": o relatório por forma de pagamento
// mostraria dinheiro que não ficou no caixa). Se o caixa já registrou pagamentos (ex.: a
// forma mudou na porta), eles valem e o fechamento confere se cobrem o total.
export async function concluirEntregaNaTransacao(
  manager: EntityManager,
  tenantId: string,
  entrega: Entrega,
  usuarioId: string
): Promise<void> {
  const comanda = await manager.findOneByOrFail(Comanda, { id: entrega.comandaId, tenantId });
  // Desconto já lançado pelo caixa (com permissão conferida naquele momento).
  const desconto = { descontoTipo: comanda.descontoTipo, descontoValor: comanda.descontoValor };
  const pagamentosExistentes = await manager.countBy(PagamentoComanda, { comandaId: comanda.id });

  if (pagamentosExistentes === 0) {
    const { calculado } = await carregarExtrato(manager, tenantId, comanda.id);
    const { total_final: valor } = calcularTotalComEntrega(
      calculado.resumo_financeiro.valor_total_comanda,
      { tipo: desconto.descontoTipo, valor: desconto.descontoValor },
      calculado.resumo_financeiro.taxa_entrega
    );

    await manager.save(
      manager.create(PagamentoComanda, { comandaId: comanda.id, forma: entrega.formaPagamentoPrevista, valor, usuarioId })
    );
  }

  await fecharComandaNaTransacao(manager, {
    tenantId,
    comandaId: comanda.id,
    dto: desconto,
    actorPodeConcederDesconto: true,
  });
}

// "Cancelado" = nada a cobrar: todos os itens vão para cancelado e a comanda fecha pelo
// mesmo caminho do "cancelar comanda zerada". Com pagamento já registrado, recusa: o
// estorno precisa ser feito no caixa antes, para a comanda não fechar com dinheiro recebido.
export async function cancelarEntregaNaTransacao(manager: EntityManager, tenantId: string, entrega: Entrega): Promise<void> {
  const pagamentos = await manager.countBy(PagamentoComanda, { comandaId: entrega.comandaId });

  if (pagamentos > 0) {
    throw new AppError(
      "Esta entrega já tem pagamento registrado. Remova o pagamento no caixa (estorno) antes de cancelar.",
      400
    );
  }

  const pedidos = await manager.find(Pedido, { select: { id: true }, where: { comandaId: entrega.comandaId } });
  const pedidoIds = pedidos.map((pedido) => pedido.id);

  if (pedidoIds.length > 0) {
    await manager.update(ItemPedido, { pedidoId: In(pedidoIds) }, { statusItem: StatusItem.CANCELADO });
    await manager.update(Pedido, { id: In(pedidoIds) }, { statusPreparo: calcularStatusPreparoPedido([StatusItem.CANCELADO]) });
  }

  await cancelarComandaZeradaNaTransacao(manager, tenantId, entrega.comandaId);
}
