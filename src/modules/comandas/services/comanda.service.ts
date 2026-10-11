import { In } from "typeorm";
import { AppDataSource } from "../../../config/data-source";
import { AppError } from "../../../shared/errors/app-error";
import { isUniqueViolation } from "../../../shared/utils/is-unique-violation";
import { PrintQueue } from "../../impressao/queue/print-queue";
import { itensDoExtratoParaImpressao } from "../../impressao/formatters/itens-do-extrato";
import { Tenant } from "../../tenants/entities/tenant.entity";
import { AddPagamentoComandaDto } from "../dtos/add-pagamento-comanda.dto";
import { FecharComandaDto } from "../dtos/fechar-comanda.dto";
import { UpdateDescontoComandaDto } from "../dtos/update-desconto-comanda.dto";
import { CreateComandaDto } from "../dtos/create-comanda.dto";
import { JoinComandasDto } from "../dtos/join-comandas.dto";
import { ListComandasFilters } from "../dtos/list-comandas.dto";
import { Comanda, ComandaStatus, DescontoTipo, TipoAtendimento } from "../entities/comanda.entity";
import { IntegranteComanda } from "../entities/integrante-comanda.entity";
import { PagamentoComanda } from "../entities/pagamento-comanda.entity";
import { calcularDesconto } from "./desconto-calculator";
import { carregarExtrato, ExtratoCarregado } from "./extrato-loader";
import { podeCancelarComandaZerada } from "./fechamento-calculator";
import { fecharComandaNaTransacao, FechamentoResultado } from "./fechamento-comanda";
import { exigirNumeroDaMesa } from "./numero-comanda";

export type { FechamentoResultado } from "./fechamento-comanda";

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
            tipoAtendimento: TipoAtendimento.MESA,
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

  static async getExtrato(tenantId: string, comandaId: string): Promise<ExtratoCarregado> {
    return carregarExtrato(AppDataSource.manager, tenantId, comandaId);
  }

  static async addPagamento(
    tenantId: string,
    comandaId: string,
    usuarioId: string,
    dto: AddPagamentoComandaDto
  ): Promise<PagamentoComanda> {
    const comandaRepository = AppDataSource.getRepository(Comanda);
    const comanda = await comandaRepository.findOne({ where: { id: comandaId, tenantId } });

    if (!comanda) {
      throw new AppError("Comanda não encontrada.", 404);
    }

    if (comanda.status !== ComandaStatus.ABERTA) {
      throw new AppError("Não é possível registrar pagamentos em uma comanda já fechada.", 400);
    }

    const pagamentoRepository = AppDataSource.getRepository(PagamentoComanda);
    const pagamento = pagamentoRepository.create({
      comandaId: comanda.id,
      forma: dto.forma,
      valor: dto.valor,
      usuarioId,
    });

    return pagamentoRepository.save(pagamento);
  }

  static async removePagamento(tenantId: string, comandaId: string, pagamentoId: string): Promise<void> {
    const comandaRepository = AppDataSource.getRepository(Comanda);
    const comanda = await comandaRepository.findOne({ where: { id: comandaId, tenantId } });

    if (!comanda) {
      throw new AppError("Comanda não encontrada.", 404);
    }

    if (comanda.status !== ComandaStatus.ABERTA) {
      throw new AppError("Não é possível remover pagamentos de uma comanda já fechada.", 400);
    }

    const pagamentoRepository = AppDataSource.getRepository(PagamentoComanda);
    const resultado = await pagamentoRepository.delete({ id: pagamentoId, comandaId: comanda.id });

    if (resultado.affected === 0) {
      throw new AppError("Pagamento não encontrado.", 404);
    }
  }

  static async atualizarDesconto(
    tenantId: string,
    comandaId: string,
    dto: UpdateDescontoComandaDto,
    actorPodeConcederDesconto: boolean
  ): Promise<Comanda> {
    const { comanda, calculado } = await this.getExtrato(tenantId, comandaId);

    if (comanda.status !== ComandaStatus.ABERTA) {
      throw new AppError("Não é possível alterar o desconto de uma comanda já fechada.", 400);
    }

    if (dto.descontoTipo !== DescontoTipo.NENHUM && !actorPodeConcederDesconto) {
      throw new AppError("Você não tem permissão para conceder desconto.", 403);
    }

    calcularDesconto(calculado.resumo_financeiro.valor_total_comanda, {
      tipo: dto.descontoTipo,
      valor: dto.descontoValor,
    });

    comanda.descontoTipo = dto.descontoTipo;
    comanda.descontoValor = dto.descontoValor;

    const comandaRepository = AppDataSource.getRepository(Comanda);
    return comandaRepository.save(comanda);
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

  static async imprimirPreConta(tenantId: string, comandaId: string): Promise<void> {
    const { comanda, calculado } = await this.getExtrato(tenantId, comandaId);

    if (comanda.status !== ComandaStatus.ABERTA) {
      throw new AppError("Não é possível imprimir a pré-conta de uma comanda já fechada.", 400);
    }

    await PrintQueue.enqueuePreConta({
      tenant_id: tenantId,
      comanda_id: comanda.id,
      numero_comanda: exigirNumeroDaMesa(comanda.numeroComanda),
      gerado_em: new Date(),
      itens: itensDoExtratoParaImpressao(calculado),
      valor_total: calculado.resumo_financeiro.valor_total_comanda,
    });
  }

  static async fechar(
    tenantId: string,
    comandaId: string,
    dto: FecharComandaDto,
    actorPodeConcederDesconto: boolean
  ): Promise<FechamentoResultado> {
    return AppDataSource.transaction((manager) =>
      fecharComandaNaTransacao(manager, { tenantId, comandaId, dto, actorPodeConcederDesconto })
    );
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
