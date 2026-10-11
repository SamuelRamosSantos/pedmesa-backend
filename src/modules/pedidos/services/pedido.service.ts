import { EntityManager } from "typeorm";
import { AppDataSource } from "../../../config/data-source";
import { AppError } from "../../../shared/errors/app-error";
import { Comanda, ComandaStatus } from "../../comandas/entities/comanda.entity";
import { exigirNumeroDaMesa } from "../../comandas/services/numero-comanda";
import { PrintQueue } from "../../impressao/queue/print-queue";
import { Tenant } from "../../tenants/entities/tenant.entity";
import { UserRole } from "../../usuarios/entities/user.entity";
import { CreatePedidoDto } from "../dtos/create-pedido.dto";
import { ListPedidosFilters } from "../dtos/list-pedidos.dto";
import { ItemPedido, StatusItem } from "../entities/item-pedido.entity";
import { LogExclusaoItem } from "../entities/log-exclusao-item.entity";
import { Pedido, StatusPreparo } from "../entities/pedido.entity";
import { assertTransicaoValida } from "./item-status-transition";
import { lancarItensNaComanda } from "./lancamento-itens";
import { assertPodeExcluirPedido } from "./pedido-delete-guard";
import { executarAcoesPosCommit, notificarPreparoAtualizado } from "./preparo-atualizado.port";
import { calcularStatusPreparoPedido } from "./status-preparo-calculator";

export class PedidoService {
  static async create(tenantId: string, usuarioId: string, comandaId: string, dto: CreatePedidoDto): Promise<Pedido> {
    const tenantRepository = AppDataSource.getRepository(Tenant);
    const tenant = await tenantRepository.findOne({ where: { id: tenantId } });

    if (!tenant) {
      throw new AppError("Tenant não encontrado.", 404);
    }

    const comandaRepository = AppDataSource.getRepository(Comanda);
    const comanda = await comandaRepository.findOne({ where: { id: comandaId, tenantId } });

    if (!comanda) {
      throw new AppError("Comanda não encontrada.", 404);
    }

    if (comanda.status !== ComandaStatus.ABERTA) {
      throw new AppError("Não é possível lançar itens em uma comanda fechada.", 400);
    }

    // Validado antes da transação: o ticket da cozinha só é enfileirado depois do
    // commit, então recusar ali deixaria o pedido gravado com resposta de erro.
    const numeroMesa = exigirNumeroDaMesa(comanda.numeroComanda);

    const { pedido, itensImpressao } = await AppDataSource.transaction((manager) =>
      lancarItensNaComanda(manager, tenant, comanda, usuarioId, dto)
    );

    // Fora da transação, só depois do commit (PED-95).
    await PrintQueue.enqueuePedidoCozinha({
      tenant_id: tenantId,
      comanda_id: comanda.id,
      pedido_id: pedido.id,
      numero_comanda: numeroMesa,
      numero_entrega: null,
      criado_em: pedido.criadoEm,
      itens: itensImpressao,
    });

    return pedido;
  }

  static async list(tenantId: string, filters: ListPedidosFilters): Promise<Pedido[]> {
    const repository = AppDataSource.getRepository(Pedido);

    const query = repository
      .createQueryBuilder("pedido")
      .innerJoin("pedido.comanda", "comanda")
      .innerJoin("pedido.usuario", "usuario")
      .addSelect(["comanda.id", "comanda.numeroComanda", "usuario.id", "usuario.nome"])
      .leftJoinAndSelect("pedido.itens", "item")
      .leftJoinAndSelect("item.produto", "produto")
      .leftJoinAndSelect("item.integrante", "integrante")
      .where("comanda.tenantId = :tenantId", { tenantId })
      .andWhere("comanda.status = :comandaAberta", { comandaAberta: ComandaStatus.ABERTA })
      .orderBy("pedido.criadoEm", "ASC");

    if (filters.status) {
      query.andWhere("pedido.statusPreparo = :status", { status: filters.status });
    } else {
      query.andWhere("pedido.statusPreparo != :entregue", { entregue: StatusPreparo.ENTREGUE });
    }

    return query.getMany();
  }

  static async updateItemStatus(
    tenantId: string,
    itemId: string,
    novoStatus: StatusItem
  ): Promise<{ item: ItemPedido; pedido: Pedido }> {
    const { item, pedido, acoesPosCommit } = await AppDataSource.transaction(async (manager) => {
      // O tipo de atendimento vem no mesmo join que já garante o tenant: para mesa, o
      // handler do delivery sai sem nova consulta.
      const item = await manager
        .createQueryBuilder(ItemPedido, "item")
        .innerJoin("item.pedido", "pedido")
        .innerJoin("pedido.comanda", "comanda")
        .addSelect(["pedido.id", "pedido.comandaId", "comanda.id", "comanda.tipoAtendimento"])
        .where("item.id = :itemId", { itemId })
        .andWhere("comanda.tenantId = :tenantId", { tenantId })
        .getOne();

      if (!item) {
        throw new AppError("Item de pedido não encontrado.", 404);
      }

      assertTransicaoValida(item.statusItem, novoStatus);

      await manager.update(ItemPedido, { id: item.id }, { statusItem: novoStatus });
      item.statusItem = novoStatus;

      const pedido = await recalcularStatusPreparo(manager, item.pedidoId);
      const acoesPosCommit = await notificarPreparoAtualizado(manager, {
        tenantId,
        comandaId: item.pedido.comandaId,
        tipoAtendimento: item.pedido.comanda.tipoAtendimento,
      });

      return { item, pedido, acoesPosCommit };
    });

    await executarAcoesPosCommit(acoesPosCommit);

    return { item, pedido };
  }

  static async deleteItem(tenantId: string, itemId: string, excluidoPorUsuarioId: string): Promise<void> {
    const acoesPosCommit = await AppDataSource.transaction(async (manager) => {
      const item = await manager
        .createQueryBuilder(ItemPedido, "item")
        .innerJoinAndSelect("item.produto", "produto")
        .innerJoinAndSelect("item.pedido", "pedido")
        .innerJoinAndSelect("pedido.comanda", "comanda")
        .where("item.id = :itemId", { itemId })
        .andWhere("comanda.tenantId = :tenantId", { tenantId })
        .getOne();

      if (!item) {
        throw new AppError("Item de pedido não encontrado.", 404);
      }

      if (item.pedido.comanda.status !== ComandaStatus.ABERTA) {
        throw new AppError("Não é possível excluir itens de uma comanda já fechada.", 400);
      }

      await manager.save(
        manager.create(LogExclusaoItem, {
          tenantId,
          comandaId: item.pedido.comandaId,
          numeroComanda: exigirNumeroDaMesa(item.pedido.comanda.numeroComanda),
          pedidoId: item.pedidoId,
          produtoNome: item.produto.nome,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
          excluidoPorUsuarioId,
        })
      );

      await manager.delete(ItemPedido, { id: itemId });
      await recalcularStatusPreparo(manager, item.pedidoId);

      return notificarPreparoAtualizado(manager, {
        tenantId,
        comandaId: item.pedido.comandaId,
        tipoAtendimento: item.pedido.comanda.tipoAtendimento,
      });
    });

    await executarAcoesPosCommit(acoesPosCommit);
  }

  static async deleteOwnPedido(
    tenantId: string,
    pedidoId: string,
    actingUserId: string,
    actingUserRoles: UserRole[]
  ): Promise<void> {
    const repository = AppDataSource.getRepository(Pedido);

    const pedido = await repository
      .createQueryBuilder("pedido")
      .innerJoinAndSelect("pedido.itens", "item")
      .innerJoinAndSelect("item.produto", "produto")
      .innerJoinAndSelect("pedido.comanda", "comanda")
      .where("pedido.id = :pedidoId", { pedidoId })
      .andWhere("comanda.tenantId = :tenantId", { tenantId })
      .getOne();

    if (!pedido) {
      throw new AppError("Pedido não encontrado.", 404);
    }

    if (pedido.comanda.status !== ComandaStatus.ABERTA) {
      throw new AppError("Não é possível excluir pedidos de uma comanda já fechada.", 400);
    }

    assertPodeExcluirPedido({
      itens: pedido.itens.map((item) => ({
        statusItem: item.statusItem,
        precisaPreparo: item.produto.precisaPreparo,
      })),
      pedidoUsuarioId: pedido.usuarioId,
      actingUserId,
      actingUserRoles,
    });

    // Excluir um pedido inteiro também muda o preparo da comanda (ex.: só restam pedidos
    // prontos), então avisa a porta na mesma transação.
    const acoesPosCommit = await AppDataSource.transaction(async (manager) => {
      await manager.remove(pedido);

      return notificarPreparoAtualizado(manager, {
        tenantId,
        comandaId: pedido.comandaId,
        tipoAtendimento: pedido.comanda.tipoAtendimento,
      });
    });

    await executarAcoesPosCommit(acoesPosCommit);
  }
}

// Recalcula e grava o status de preparo do pedido a partir dos itens que restaram.
async function recalcularStatusPreparo(manager: EntityManager, pedidoId: string): Promise<Pedido> {
  const itens = await manager.find(ItemPedido, { where: { pedidoId } });
  const pedido = await manager.findOneOrFail(Pedido, { where: { id: pedidoId } });
  pedido.statusPreparo = calcularStatusPreparoPedido(itens.map((item) => item.statusItem));

  return manager.save(pedido);
}
