import { AppDataSource } from "../../../config/data-source";
import { AppError } from "../../../shared/errors/app-error";
import { carregarExtrato } from "../../comandas/services/extrato-loader";
import { PrintQueue } from "../../impressao/queue/print-queue";
import { Entrega, StatusEntrega } from "../entities/entrega.entity";
import { montarJobEntrega } from "./ticket-entrega";

// Enfileira o cupom do motoboy (PED-102). Único ponto de disparo: ao entrar em "pronto
// para envio" (na criação do pedido e, depois, nas transições do PED-98/PED-99) e na
// reimpressão manual. Chame FORA de transação (depois do commit), como toda impressão.
export async function enfileirarTicketEntrega(tenantId: string, entregaId: string): Promise<void> {
  const manager = AppDataSource.manager;
  const entrega = await manager.findOne(Entrega, { where: { id: entregaId, tenantId }, relations: { cliente: true } });

  if (!entrega) {
    throw new AppError("Entrega não encontrada.", 404);
  }

  if (entrega.statusEntrega === StatusEntrega.CANCELADO) {
    throw new AppError("Não é possível imprimir o cupom de uma entrega cancelada.", 400);
  }

  const { calculado } = await carregarExtrato(manager, tenantId, entrega.comandaId);

  await PrintQueue.enqueueEntrega(montarJobEntrega(entrega, entrega.cliente, calculado, new Date()));
}
