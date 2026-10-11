import { AppDataSource } from "../../../config/data-source";
import { AppError } from "../../../shared/errors/app-error";
import { Pedido } from "../../pedidos/entities/pedido.entity";
import { AcaoPosCommit, executarAcoesPosCommit } from "../../pedidos/services/preparo-atualizado.port";
import { TransicaoEntregaDto } from "../dtos/transicao-entrega.dto";
import { Entrega, StatusEntrega } from "../entities/entrega.entity";
import { toEntregaEstadoResponse } from "../mappers/entrega.mapper";
import { cancelarEntregaNaTransacao, concluirEntregaNaTransacao } from "./encerramento-entrega";
import { assertTransicaoEntregaValida } from "./entrega-status-transition";
import { registrarHistoricoStatusEntrega } from "./historico-status-entrega";
import { enfileirarTicketEntrega } from "./ticket-entrega.service";

function erroDeConcorrencia(atual: Entrega): AppError {
  return new AppError("Esta entrega foi atualizada por outra pessoa. Confira o estado atual e tente de novo.", 409, {
    entrega: toEntregaEstadoResponse(atual),
  });
}

// PATCH /delivery/entregas/:id/status (PED-99). Optimistic locking: o operador envia a
// versão que estava vendo; o UPDATE só acontece se ela ainda for a atual. Tudo (status,
// horários, histórico e, em entregue/cancelado, o encerramento da comanda do PED-100) roda
// numa transação só. Impressão só depois do commit.
export async function transicionarEntrega(
  tenantId: string,
  entregaId: string,
  usuarioId: string,
  dto: TransicaoEntregaDto
): Promise<Entrega> {
  const acoesPosCommit: AcaoPosCommit[] = [];

  const entregaAtualizada = await AppDataSource.transaction(async (manager) => {
    const entrega = await manager.findOneBy(Entrega, { id: entregaId, tenantId });

    if (!entrega) {
      throw new AppError("Entrega não encontrada.", 404);
    }

    if (entrega.versao !== dto.versao) {
      throw erroDeConcorrencia(entrega);
    }

    const pedidos = await manager.find(Pedido, { select: { id: true, statusPreparo: true }, where: { comandaId: entrega.comandaId } });
    assertTransicaoEntregaValida(entrega.statusEntrega, dto.status, {
      statusPreparoDosPedidos: pedidos.map((pedido) => pedido.statusPreparo),
      motivo: dto.motivo,
    });

    const agora = new Date();
    const resultado = await manager
      .createQueryBuilder()
      .update(Entrega)
      .set({
        statusEntrega: dto.status,
        versao: () => "versao + 1",
        ...(dto.status === StatusEntrega.EM_ROTA ? { saiuEm: agora } : {}),
        ...(dto.status === StatusEntrega.ENTREGUE ? { entregueEm: agora } : {}),
        ...(dto.status === StatusEntrega.CANCELADO ? { motivoCancelamento: dto.motivo } : {}),
      })
      .where("id = :id", { id: entrega.id })
      .andWhere("tenant_id = :tenantId", { tenantId })
      .andWhere("versao = :versao", { versao: dto.versao })
      .execute();

    // Outro operador gravou entre a leitura e o UPDATE.
    if (resultado.affected === 0) {
      throw erroDeConcorrencia(await manager.findOneByOrFail(Entrega, { id: entrega.id, tenantId }));
    }

    await registrarHistoricoStatusEntrega(manager, {
      tenantId,
      entregaId: entrega.id,
      statusAnterior: entrega.statusEntrega,
      statusNovo: dto.status,
      usuarioId,
      motivo: dto.motivo,
    });

    if (dto.status === StatusEntrega.ENTREGUE) {
      await concluirEntregaNaTransacao(manager, tenantId, entrega, usuarioId);
    }

    if (dto.status === StatusEntrega.CANCELADO) {
      await cancelarEntregaNaTransacao(manager, tenantId, entrega);
    }

    // Cupom do motoboy só ao ficar pronta vindo da produção; no retorno da rota o cupom
    // já está com o entregador (para isso existe a reimpressão).
    if (entrega.statusEntrega === StatusEntrega.EM_PRODUCAO && dto.status === StatusEntrega.PRONTO_PARA_ENVIO) {
      acoesPosCommit.push(() => enfileirarTicketEntrega(tenantId, entrega.id));
    }

    return manager.findOneByOrFail(Entrega, { id: entrega.id, tenantId });
  });

  await executarAcoesPosCommit(acoesPosCommit);

  return entregaAtualizada;
}
