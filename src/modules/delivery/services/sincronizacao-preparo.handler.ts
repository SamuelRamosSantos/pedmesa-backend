import { EntityManager } from "typeorm";
import { TipoAtendimento } from "../../comandas/entities/comanda.entity";
import { ItemPedido, StatusItem } from "../../pedidos/entities/item-pedido.entity";
import { Pedido } from "../../pedidos/entities/pedido.entity";
import {
  AcaoPosCommit,
  PreparoAtualizado,
  registrarPreparoAtualizadoHandler,
} from "../../pedidos/services/preparo-atualizado.port";
import { Entrega, StatusEntrega } from "../entities/entrega.entity";
import { assertTransicaoEntregaValida } from "./entrega-status-transition";
import { registrarHistoricoStatusEntrega } from "./historico-status-entrega";
import { decidirStatusPorPreparo } from "./sincronizacao-preparo";
import { enfileirarTicketEntrega } from "./ticket-entrega.service";

const MOTIVO_AUTOMATICO = "Sincronização automática com o preparo da cozinha.";

// Implementação da porta PreparoAtualizado para o delivery (PED-98).
export async function sincronizarEntregaComPreparo(manager: EntityManager, evento: PreparoAtualizado): Promise<AcaoPosCommit[]> {
  if (evento.tipoAtendimento !== TipoAtendimento.DELIVERY) {
    return [];
  }

  // Trava a entrega: uma transição manual simultânea (PED-99) espera esta terminar.
  const entrega = await manager
    .createQueryBuilder(Entrega, "entrega")
    .setLock("pessimistic_write")
    .where("entrega.comandaId = :comandaId", { comandaId: evento.comandaId })
    .andWhere("entrega.tenantId = :tenantId", { tenantId: evento.tenantId })
    .getOne();

  if (!entrega) {
    return [];
  }

  const pedidos = await manager.find(Pedido, { select: { id: true, statusPreparo: true }, where: { comandaId: evento.comandaId } });
  const itensAtivos = await manager
    .createQueryBuilder(ItemPedido, "item")
    .innerJoin("item.pedido", "pedido")
    .where("pedido.comandaId = :comandaId", { comandaId: evento.comandaId })
    .andWhere("item.statusItem != :cancelado", { cancelado: StatusItem.CANCELADO })
    .getCount();

  const statusPreparoDosPedidos = pedidos.map((pedido) => pedido.statusPreparo);
  const novoStatus = decidirStatusPorPreparo(entrega.statusEntrega, statusPreparoDosPedidos, itensAtivos > 0);

  if (novoStatus === null) {
    return [];
  }

  // A mesma máquina de estados das transições manuais (nenhuma regra paralela).
  assertTransicaoEntregaValida(entrega.statusEntrega, novoStatus, { statusPreparoDosPedidos, motivo: MOTIVO_AUTOMATICO });

  const statusAnterior = entrega.statusEntrega;
  entrega.statusEntrega = novoStatus;
  await manager.save(entrega);

  await registrarHistoricoStatusEntrega(manager, {
    tenantId: evento.tenantId,
    entregaId: entrega.id,
    statusAnterior,
    statusNovo: novoStatus,
    usuarioId: null,
    motivo: MOTIVO_AUTOMATICO,
  });

  // Só ao entrar em "pronto para envio" vindo da cozinha: o cupom do motoboy (PED-102).
  return novoStatus === StatusEntrega.PRONTO_PARA_ENVIO
    ? [() => enfileirarTicketEntrega(evento.tenantId, entrega.id)]
    : [];
}

// Chamado uma vez na composição do app (server.ts).
export function registrarSincronizacaoPreparoDelivery(): void {
  registrarPreparoAtualizadoHandler(sincronizarEntregaComPreparo);
}
