import { In } from "typeorm";
import { AppDataSource } from "../../../config/data-source";
import { AppError } from "../../../shared/errors/app-error";
import { Comanda, ComandaStatus } from "../../comandas/entities/comanda.entity";
import { IntegranteComanda } from "../../comandas/entities/integrante-comanda.entity";
import { PrintQueue } from "../../impressao/queue/print-queue";
import { Product } from "../../produtos/entities/product.entity";
import { CreatePedidoDto } from "../dtos/create-pedido.dto";
import { ItemPedido } from "../entities/item-pedido.entity";
import { Pedido, StatusPreparo } from "../entities/pedido.entity";

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
        });
      });

      pedidoCriado.itens = await manager.save(itens);

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
}
