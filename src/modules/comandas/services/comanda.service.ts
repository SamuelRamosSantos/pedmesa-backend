import { In } from "typeorm";
import { AppDataSource } from "../../../config/data-source";
import { AppError } from "../../../shared/errors/app-error";
import { fromCents } from "../../../shared/utils/money";
import { isUniqueViolation } from "../../../shared/utils/is-unique-violation";
import { ItemPedido } from "../../pedidos/entities/item-pedido.entity";
import { Tenant } from "../../tenants/entities/tenant.entity";
import { FecharComandaDto } from "../dtos/fechar-comanda.dto";
import { CreateComandaDto } from "../dtos/create-comanda.dto";
import { JoinComandasDto } from "../dtos/join-comandas.dto";
import { ListComandasFilters } from "../dtos/list-comandas.dto";
import { Comanda, ComandaStatus } from "../entities/comanda.entity";
import { IntegranteComanda } from "../entities/integrante-comanda.entity";
import { calcularExtrato, ExtratoCalculado } from "./extrato-calculator";
import { avaliarFechamento, podeCancelarComandaZerada } from "./fechamento-calculator";

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
        id: item.id,
        produtoNome: item.produto.nome,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        integranteId: item.integranteId,
        statusItem: item.statusItem,
      })),
      integrantes: comanda.integrantes.map((integrante) => ({ id: integrante.id, nome: integrante.nome })),
    });

    return { comanda, calculado };
  }

  static async juntar(tenantId: string, dto: JoinComandasDto): Promise<Comanda> {
    const comandaRepository = AppDataSource.getRepository(Comanda);
    const todosOsIds = [dto.comandaPrincipalId, ...dto.comandasSecundariasIds];

    const comandasEncontradas = await comandaRepository.findBy({ id: In(todosOsIds), tenantId });
    const comandasPorId = new Map(comandasEncontradas.map((comanda) => [comanda.id, comanda]));

    const comandaPrincipal = comandasPorId.get(dto.comandaPrincipalId);

    if (!comandaPrincipal) {
      throw new AppError("Comanda principal não encontrada.", 404);
    }

    if (comandaPrincipal.status !== ComandaStatus.ABERTA) {
      throw new AppError("A comanda principal precisa estar aberta para receber a junção.", 400);
    }

    dto.comandasSecundariasIds.forEach((id) => {
      const comandaSecundaria = comandasPorId.get(id);

      if (!comandaSecundaria) {
        throw new AppError(`A comanda secundária ${id} não foi encontrada.`, 404);
      }

      if (comandaSecundaria.status !== ComandaStatus.ABERTA) {
        throw new AppError(`A comanda secundária ${id} não está aberta.`, 400);
      }
    });

    await AppDataSource.transaction(async (manager) => {
      await manager.update(
        IntegranteComanda,
        { comandaId: In(dto.comandasSecundariasIds) },
        { comandaId: comandaPrincipal.id }
      );

      await manager.update(
        Comanda,
        { id: In(dto.comandasSecundariasIds) },
        { comandaPaiId: comandaPrincipal.id, status: ComandaStatus.FECHADA, fechadaEm: new Date() }
      );
    });

    return comandaPrincipal;
  }

  static async fechar(tenantId: string, comandaId: string, dto: FecharComandaDto): Promise<Comanda> {
    const { comanda, calculado } = await this.getExtrato(tenantId, comandaId);

    if (comanda.status !== ComandaStatus.ABERTA) {
      throw new AppError("Esta comanda já está fechada.", 400);
    }

    const avaliacao = avaliarFechamento(calculado.resumo_financeiro.valor_total_comanda, dto.pagamentos);

    if (!avaliacao.suficiente) {
      throw new AppError(
        `Valor pago (R$ ${fromCents(avaliacao.totalPagoCents).toFixed(2)}) é insuficiente para quitar a comanda (total: R$ ${fromCents(
          avaliacao.totalComandaCents
        ).toFixed(2)}).`,
        400
      );
    }

    return AppDataSource.transaction(async (manager) => {
      const comandaTravada = await manager.findOne(Comanda, { where: { id: comanda.id, tenantId } });

      if (!comandaTravada || comandaTravada.status !== ComandaStatus.ABERTA) {
        throw new AppError("Esta comanda já está fechada.", 400);
      }

      comandaTravada.status = ComandaStatus.FECHADA;
      comandaTravada.fechadaEm = new Date();

      return manager.save(comandaTravada);
    });
  }

  static async cancelarZerada(tenantId: string, comandaId: string): Promise<Comanda> {
    const { comanda, calculado } = await this.getExtrato(tenantId, comandaId);

    if (comanda.status !== ComandaStatus.ABERTA) {
      throw new AppError("Esta comanda já está fechada.", 400);
    }

    if (!podeCancelarComandaZerada(calculado.resumo_financeiro.valor_total_comanda)) {
      throw new AppError(
        "Esta comanda possui itens com valor pendente e não pode ser cancelada diretamente. Utilize o fechamento com pagamento.",
        400
      );
    }

    return AppDataSource.transaction(async (manager) => {
      const comandaTravada = await manager.findOne(Comanda, { where: { id: comanda.id, tenantId } });

      if (!comandaTravada || comandaTravada.status !== ComandaStatus.ABERTA) {
        throw new AppError("Esta comanda já está fechada.", 400);
      }

      comandaTravada.status = ComandaStatus.FECHADA;
      comandaTravada.fechadaEm = new Date();

      return manager.save(comandaTravada);
    });
  }
}
