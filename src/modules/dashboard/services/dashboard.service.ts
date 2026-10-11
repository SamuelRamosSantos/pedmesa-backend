import { In, ObjectLiteral, SelectQueryBuilder } from "typeorm";
import { AppDataSource } from "../../../config/data-source";
import { fromCents, toCents } from "../../../shared/utils/money";
import { Comanda, ComandaStatus, TipoAtendimento } from "../../comandas/entities/comanda.entity";
import { FormaPagamento, PagamentoComanda } from "../../comandas/entities/pagamento-comanda.entity";
import { ItemPedido, StatusItem } from "../../pedidos/entities/item-pedido.entity";
import { identificadorDoAtendimento } from "./identificador-atendimento";
import { IntervaloData } from "./periodo-resolver";

export interface ResumoDashboard {
  // Inclui delivery: o total_final da comanda delivery já soma a taxa de entrega.
  faturamento: number;
  // Parte do faturamento que veio de taxas de entrega (PED-103).
  taxasEntrega: number;
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
  tipoAtendimento: TipoAtendimento;
  // "Mesa 12" ou "Delivery #7" (PED-103).
  identificador: string;
  valor: number;
  formasPagamento: FormaPagamento[];
}

const LIMITE_PRODUTOS_MAIS_PEDIDOS = 5;

// Filtro opcional ?tipo= do dashboard; sem ele, mesa e delivery entram juntos.
function filtrarPorTipo<T extends ObjectLiteral>(
  consulta: SelectQueryBuilder<T>,
  tipo: TipoAtendimento | undefined
): SelectQueryBuilder<T> {
  return tipo === undefined ? consulta : consulta.andWhere("comanda.tipoAtendimento = :tipo", { tipo });
}

export class DashboardService {
  static async getResumo(
    tenantId: string,
    intervalo: IntervaloData,
    tipo: TipoAtendimento | undefined
  ): Promise<ResumoDashboard> {
    const comandaRepository = AppDataSource.getRepository(Comanda);

    // Comanda × entrega é 1:1: o LEFT JOIN não duplica linhas na soma do faturamento.
    // Entrega cancelada fecha a comanda sem total_final, então a taxa dela não entra.
    const consulta = comandaRepository
      .createQueryBuilder("comanda")
      .leftJoin("comanda.entrega", "entrega")
      .select("COALESCE(SUM(comanda.totalFinal), 0)", "faturamento")
      .addSelect("COALESCE(SUM(entrega.taxaEntrega), 0)", "taxasEntrega")
      .addSelect("COUNT(*)", "quantidade")
      .where("comanda.tenantId = :tenantId", { tenantId })
      .andWhere("comanda.status = :status", { status: ComandaStatus.FECHADA })
      .andWhere("comanda.totalFinal IS NOT NULL")
      .andWhere("comanda.fechadaEm BETWEEN :inicio AND :fim", intervalo);

    const bruto = await filtrarPorTipo(consulta, tipo).getRawOne<{
      faturamento: string;
      taxasEntrega: string;
      quantidade: string;
    }>();

    const faturamentoCents = toCents(Number(bruto?.faturamento ?? 0));
    const comandasFechadas = Number(bruto?.quantidade ?? 0);
    const ticketMedioCents = comandasFechadas > 0 ? Math.round(faturamentoCents / comandasFechadas) : 0;

    return {
      faturamento: fromCents(faturamentoCents),
      taxasEntrega: fromCents(toCents(Number(bruto?.taxasEntrega ?? 0))),
      comandasFechadas,
      ticketMedio: fromCents(ticketMedioCents),
    };
  }

  static async getProdutosMaisPedidos(
    tenantId: string,
    intervalo: IntervaloData,
    tipo: TipoAtendimento | undefined
  ): Promise<ProdutoMaisPedido[]> {
    const itemRepository = AppDataSource.getRepository(ItemPedido);

    const consulta = itemRepository
      .createQueryBuilder("item")
      .innerJoin("item.pedido", "pedido")
      .innerJoin("pedido.comanda", "comanda")
      .innerJoin("item.produto", "produto")
      .select("produto.nome", "produtoNome")
      .addSelect("SUM(item.quantidade)", "quantidade")
      .where("comanda.tenantId = :tenantId", { tenantId })
      .andWhere("comanda.status = :status", { status: ComandaStatus.FECHADA })
      .andWhere("comanda.fechadaEm BETWEEN :inicio AND :fim", intervalo)
      .andWhere("item.statusItem != :cancelado", { cancelado: StatusItem.CANCELADO });

    const linhas = await filtrarPorTipo(consulta, tipo)
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

  static async getHistoricoComandas(
    tenantId: string,
    intervalo: IntervaloData,
    tipo: TipoAtendimento | undefined
  ): Promise<HistoricoComandaLinha[]> {
    const comandaRepository = AppDataSource.getRepository(Comanda);

    const consulta = comandaRepository
      .createQueryBuilder("comanda")
      .leftJoin("comanda.entrega", "entrega")
      .addSelect(["entrega.id", "entrega.numeroEntrega"])
      .where("comanda.tenantId = :tenantId", { tenantId })
      .andWhere("comanda.status = :status", { status: ComandaStatus.FECHADA })
      .andWhere("comanda.totalFinal IS NOT NULL")
      .andWhere("comanda.fechadaEm BETWEEN :inicio AND :fim", intervalo);

    const comandas = await filtrarPorTipo(consulta, tipo).orderBy("comanda.fechadaEm", "DESC").getMany();

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
      tipoAtendimento: comanda.tipoAtendimento,
      identificador: identificadorDoAtendimento(
        comanda.tipoAtendimento,
        comanda.numeroComanda,
        comanda.entrega?.numeroEntrega ?? null
      ),
      valor: comanda.totalFinal as number,
      formasPagamento: Array.from(formasPorComandaId.get(comanda.id) ?? []),
    }));
  }
}
