import { AppDataSource } from "../../../config/data-source";
import { AppError } from "../../../shared/errors/app-error";
import { isUniqueViolation } from "../../../shared/utils/is-unique-violation";
import { ItemPedido } from "../../pedidos/entities/item-pedido.entity";
import { Tenant } from "../../tenants/entities/tenant.entity";
import { CreateComandaDto } from "../dtos/create-comanda.dto";
import { ListComandasFilters } from "../dtos/list-comandas.dto";
import { Comanda, ComandaStatus } from "../entities/comanda.entity";
import { IntegranteComanda } from "../entities/integrante-comanda.entity";
import { calcularExtrato, ExtratoCalculado } from "./extrato-calculator";

export class ComandaService {
  static async create(tenantId: string, dto: CreateComandaDto): Promise<Comanda> {
    const tenantRepository = AppDataSource.getRepository(Tenant);
    const tenant = await tenantRepository.findOne({ where: { id: tenantId } });

    if (!tenant) {
      throw new AppError("Tenant não encontrado.", 404);
    }

    if (dto.numeroComanda > tenant.quantidadeComandas) {
      throw new AppError(
        `O número da comanda não pode ser maior que a quantidade de comandas configurada (${tenant.quantidadeComandas}).`,
        400
      );
    }

    try {
      return await AppDataSource.transaction(async (manager) => {
        const comandaAberta = await manager.findOne(Comanda, {
          where: { tenantId, numeroComanda: dto.numeroComanda, status: ComandaStatus.ABERTA },
        });

        if (comandaAberta) {
          throw new AppError(`Já existe uma comanda aberta com o número ${dto.numeroComanda}.`, 409);
        }

        const comanda = await manager.save(
          manager.create(Comanda, {
            tenantId,
            numeroComanda: dto.numeroComanda,
            status: ComandaStatus.ABERTA,
          })
        );

        comanda.integrantes = await manager.save(
          dto.integrantes.map((integrante) =>
            manager.create(IntegranteComanda, { comandaId: comanda.id, nome: integrante.nome })
          )
        );

        return comanda;
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError(`Já existe uma comanda aberta com o número ${dto.numeroComanda}.`, 409);
      }

      throw error;
    }
  }

  static async list(tenantId: string, filters: ListComandasFilters): Promise<Comanda[]> {
    const repository = AppDataSource.getRepository(Comanda);

    return repository.find({
      where: { tenantId, status: filters.status },
      relations: { integrantes: true },
      order: { numeroComanda: "ASC" },
    });
  }

  static async addIntegrante(tenantId: string, comandaId: string, nome: string): Promise<IntegranteComanda> {
    const comandaRepository = AppDataSource.getRepository(Comanda);
    const comanda = await comandaRepository.findOne({ where: { id: comandaId, tenantId } });

    if (!comanda) {
      throw new AppError("Comanda não encontrada.", 404);
    }

    if (comanda.status !== ComandaStatus.ABERTA) {
      throw new AppError("Não é possível adicionar integrantes a uma comanda fechada.", 400);
    }

    const integranteRepository = AppDataSource.getRepository(IntegranteComanda);
    const integrante = integranteRepository.create({ comandaId, nome });

    return integranteRepository.save(integrante);
  }

  static async getExtrato(tenantId: string, comandaId: string): Promise<{ comanda: Comanda; calculado: ExtratoCalculado }> {
    const comandaRepository = AppDataSource.getRepository(Comanda);
    const comanda = await comandaRepository.findOne({
      where: { id: comandaId, tenantId },
      relations: { integrantes: true },
    });

    if (!comanda) {
      throw new AppError("Comanda não encontrada.", 404);
    }

    const itemRepository = AppDataSource.getRepository(ItemPedido);
    const itens = await itemRepository
      .createQueryBuilder("item")
      .innerJoin("item.pedido", "pedido")
      .leftJoinAndSelect("item.produto", "produto")
      .where("pedido.comandaId = :comandaId", { comandaId: comanda.id })
      .getMany();

    const calculado = calcularExtrato({
      itens: itens.map((item) => ({
        produtoNome: item.produto.nome,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        integranteId: item.integranteId,
      })),
      integrantes: comanda.integrantes.map((integrante) => ({ id: integrante.id, nome: integrante.nome })),
    });

    return { comanda, calculado };
  }
}
