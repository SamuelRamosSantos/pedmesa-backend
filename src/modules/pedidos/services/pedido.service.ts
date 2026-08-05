import { In } from "typeorm";
import { AppDataSource } from "../../../config/data-source";
import { AppError } from "../../../shared/errors/app-error";
import { Comanda, ComandaStatus } from "../../comandas/entities/comanda.entity";
import { IntegranteComanda } from "../../comandas/entities/integrante-comanda.entity";
import { PrintQueue } from "../../impressao/queue/print-queue";
import { Product } from "../../produtos/entities/product.entity";
import { UserRole } from "../../usuarios/entities/user.entity";
import { CreatePedidoDto } from "../dtos/create-pedido.dto";
import { ListPedidosFilters } from "../dtos/list-pedidos.dto";
import { ItemPedido, StatusItem } from "../entities/item-pedido.entity";
import { LogExclusaoItem } from "../entities/log-exclusao-item.entity";
import { Pedido, StatusPreparo } from "../entities/pedido.entity";
import { resolveStatusItemInicial } from "./item-status-inicial";
import { assertTransicaoValida } from "./item-status-transition";
import { assertPodeExcluirPedido } from "./pedido-delete-guard";
import { calcularStatusPreparoPedido } from "./status-preparo-calculator";

export class PedidoService {
  static async create(tenantId: string, usuarioId: string, comandaId: string, dto: CreatePedidoDto): Promise<Pedido> {
    const comandaRepository = AppDataSource.getRepository(Comanda);
    const comanda = await comandaRepository.findOne({ where: { id: comandaId, tenantId } });

    if (!comanda) {
      throw new AppError("Comanda não encontrada.", 404);
    }

    if (comanda.status !== ComandaStatus.ABERTA) {
      throw new AppError("Não é possível lançar itens em uma comanda fechada.", 400);
    }

    const produtoIds = [...new Set(dto.itens.map((item) => item.produtoId))];
    const productRepository = AppDataSource.getRepository(Product);
    const produtos = await productRepository.findBy({ id: In(produtoIds), tenantId });
    const produtosPorId = new Map(produtos.map((produto) => [produto.id, produto]));

    const integranteIds = [
      ...new Set(dto.itens.map((item) => item.integranteId).filter((id): id is string => id !== null)),
    ];
    const integrantesPorId = new Map<string, IntegranteComanda>();

    if (integranteIds.length > 0) {
      const integranteRepository = AppDataSource.getRepository(IntegranteComanda);
      const integrantes = await integranteRepository.findBy({ id: In(integranteIds), comandaId: comanda.id });
      integrantes.forEach((integrante) => integrantesPorId.set(integrante.id, integrante));
    }

    dto.itens.forEach((item, index) => {
      const produto = produtosPorId.get(item.produtoId);

      if (!produto) {
        throw new AppError(`O produto informado no item ${index} não foi encontrado.`, 400);
      }

      if (!produto.disponivel) {
        throw new AppError(`O produto "${produto.nome}" está indisponível no momento.`, 400);
      }

      if (item.integranteId !== null && !integrantesPorId.has(item.integranteId)) {
        throw new AppError(`O integrante informado no item ${index} não pertence a esta comanda.`, 400);
      }
    });

    const pedido = await AppDataSource.transaction(async (manager) => {
      const pedidoCriado = await manager.save(
        manager.create(Pedido, {
          comandaId: comanda.id,
          usuarioId,
          statusPreparo: StatusPreparo.PENDENTE,
        })
      );

      const itens = dto.itens.map((item) => {
        const produto = produtosPorId.get(item.produtoId) as Product;

        return manager.create(ItemPedido, {
          pedidoId: pedidoCriado.id,
          produtoId: item.produtoId,
          integranteId: item.integranteId,
          quantidade: item.quantidade,
          precoUnitario: produto.preco,
          observacao: item.observacao,
          statusItem: resolveStatusItemInicial(produto.precisaPreparo),
        });
      });

      pedidoCriado.itens = await manager.save(itens);

      pedidoCriado.statusPreparo = calcularStatusPreparoPedido(pedidoCriado.itens.map((item) => item.statusItem));
      await manager.save(pedidoCriado);

      return pedidoCriado;
    });

    PrintQueue.enqueue({
      tenant_id: tenantId,
      pedido_id: pedido.id,
      numero_comanda: comanda.numeroComanda,
      criado_em: pedido.criadoEm,
      itens: dto.itens.map((item) => {
        const produto = produtosPorId.get(item.produtoId) as Product;
        const integrante = item.integranteId ? integrantesPorId.get(item.integranteId) ?? null : null;

        return {
          produto_nome: produto.nome,
          quantidade: item.quantidade,
          integrante_nome: integrante?.nome ?? null,
          observacao: item.observacao,
        };
      }),
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
    return AppDataSource.transaction(async (manager) => {
      const item = await manager
        .createQueryBuilder(ItemPedido, "item")
        .innerJoin("item.pedido", "pedido")
        .innerJoin("pedido.comanda", "comanda")
        .where("item.id = :itemId", { itemId })
        .andWhere("comanda.tenantId = :tenantId", { tenantId })
        .getOne();

      if (!item) {
        throw new AppError("Item de pedido não encontrado.", 404);
      }

      assertTransicaoValida(item.statusItem, novoStatus);

      item.statusItem = novoStatus;
      await manager.save(item);

      const itensDoPedido = await manager.find(ItemPedido, { where: { pedidoId: item.pedidoId } });
      const pedido = await manager.findOneOrFail(Pedido, { where: { id: item.pedidoId } });
      pedido.statusPreparo = calcularStatusPreparoPedido(itensDoPedido.map((i) => i.statusItem));
      await manager.save(pedido);

      return { item, pedido };
    });
  }

  static async deleteItem(tenantId: string, itemId: string, excluidoPorUsuarioId: string): Promise<void> {
    await AppDataSource.transaction(async (manager) => {
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
          numeroComanda: item.pedido.comanda.numeroComanda,
          pedidoId: item.pedidoId,
          produtoNome: item.produto.nome,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
          excluidoPorUsuarioId,
        })
      );

      const pedidoId = item.pedidoId;
      await manager.delete(ItemPedido, { id: itemId });

      const itensRestantes = await manager.find(ItemPedido, { where: { pedidoId } });
      const pedido = await manager.findOneOrFail(Pedido, { where: { id: pedidoId } });
      pedido.statusPreparo = calcularStatusPreparoPedido(itensRestantes.map((i) => i.statusItem));
      await manager.save(pedido);
    });
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

    await repository.remove(pedido);
  }
}
