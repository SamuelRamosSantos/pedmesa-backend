import { In } from "typeorm";
import { AppDataSource } from "../../../config/data-source";
import { fromCents, toCents } from "../../../shared/utils/money";
import { Comanda, ComandaStatus } from "../../comandas/entities/comanda.entity";
import { FormaPagamento, PagamentoComanda } from "../../comandas/entities/pagamento-comanda.entity";
import { ItemPedido, StatusItem } from "../../pedidos/entities/item-pedido.entity";
import { IntervaloData } from "./periodo-resolver";

export interface ResumoDashboard {
  faturamento: number;
  comandasFechadas: number;
  ticketMedio: number;
}

export interface ProdutoMaisPedido {
  produtoNome: string;
  quantidade: number;
}

export interface HistoricoComandaLinha {
  comandaId: string;
  fechadaEm: Date;
  mesa: number;
  valor: number;
  formasPagamento: FormaPagamento[];
}

const LIMITE_PRODUTOS_MAIS_PEDIDOS = 5;

export class DashboardService {
  static async getResumo(tenantId: string, intervalo: IntervaloData): Promise<ResumoDashboard> {
    const comandaRepository = AppDataSource.getRepository(Comanda);

    const bruto = await comandaRepository
      .createQueryBuilder("comanda")
      .select("COALESCE(SUM(comanda.totalFinal), 0)", "faturamento")
      .addSelect("COUNT(*)", "quantidade")
      .where("comanda.tenantId = :tenantId", { tenantId })
      .andWhere("comanda.status = :status", { status: ComandaStatus.FECHADA })
      .andWhere("comanda.totalFinal IS NOT NULL")
      .andWhere("comanda.fechadaEm BETWEEN :inicio AND :fim", intervalo)
      .getRawOne<{ faturamento: string; quantidade: string }>();

    const faturamentoCents = toCents(Number(bruto?.faturamento ?? 0));
    const comandasFechadas = Number(bruto?.quantidade ?? 0);
    const ticketMedioCents = comandasFechadas > 0 ? Math.round(faturamentoCents / comandasFechadas) : 0;

    return {
      faturamento: fromCents(faturamentoCents),
      comandasFechadas,
      ticketMedio: fromCents(ticketMedioCents),
    };
  }

  static async getProdutosMaisPedidos(tenantId: string, intervalo: IntervaloData): Promise<ProdutoMaisPedido[]> {
    const itemRepository = AppDataSource.getRepository(ItemPedido);

    const linhas = await itemRepository
      .createQueryBuilder("item")
      .innerJoin("item.pedido", "pedido")
      .innerJoin("pedido.comanda", "comanda")
      .innerJoin("item.produto", "produto")
      .select("produto.nome", "produtoNome")
      .addSelect("SUM(item.quantidade)", "quantidade")
      .where("comanda.tenantId = :tenantId", { tenantId })
      .andWhere("comanda.status = :status", { status: ComandaStatus.FECHADA })
      .andWhere("comanda.fechadaEm BETWEEN :inicio AND :fim", intervalo)
      .andWhere("item.statusItem != :cancelado", { cancelado: StatusItem.CANCELADO })
      .groupBy("produto.id")
      .addGroupBy("produto.nome")
      .orderBy("quantidade", "DESC")
      .limit(LIMITE_PRODUTOS_MAIS_PEDIDOS)
      .getRawMany<{ produtoNome: string; quantidade: string }>();

    return linhas.map((linha) => ({
      produtoNome: linha.produtoNome,
      quantidade: Number(linha.quantidade),
    }));
  }

  static async getHistoricoComandas(tenantId: string, intervalo: IntervaloData): Promise<HistoricoComandaLinha[]> {
    const comandaRepository = AppDataSource.getRepository(Comanda);

    const comandas = await comandaRepository
      .createQueryBuilder("comanda")
      .where("comanda.tenantId = :tenantId", { tenantId })
      .andWhere("comanda.status = :status", { status: ComandaStatus.FECHADA })
      .andWhere("comanda.totalFinal IS NOT NULL")
      .andWhere("comanda.fechadaEm BETWEEN :inicio AND :fim", intervalo)
      .orderBy("comanda.fechadaEm", "DESC")
      .getMany();

    if (comandas.length === 0) {
      return [];
    }

    const pagamentoRepository = AppDataSource.getRepository(PagamentoComanda);
    const pagamentos = await pagamentoRepository.find({
      where: { comandaId: In(comandas.map((comanda) => comanda.id)) },
    });

    const formasPorComandaId = new Map<string, Set<FormaPagamento>>();
    pagamentos.forEach((pagamento) => {
      const formas = formasPorComandaId.get(pagamento.comandaId) ?? new Set<FormaPagamento>();
      formas.add(pagamento.forma);
      formasPorComandaId.set(pagamento.comandaId, formas);
    });

    return comandas.map((comanda) => ({
      comandaId: comanda.id,
      fechadaEm: comanda.fechadaEm as Date,
      mesa: comanda.numeroComanda,
      valor: comanda.totalFinal as number,
      formasPagamento: Array.from(formasPorComandaId.get(comanda.id) ?? []),
    }));
  }
}
