import { EntityManager } from "typeorm";
import { AppError } from "../../../shared/errors/app-error";
import { fromCents } from "../../../shared/utils/money";
import { FecharComandaDto } from "../dtos/fechar-comanda.dto";
import { Comanda, ComandaStatus, DescontoTipo } from "../entities/comanda.entity";
import { ratearDescontoPorIntegrante, RateioIntegranteComDesconto } from "./desconto-calculator";
import { carregarExtrato } from "./extrato-loader";
import { avaliarFechamento } from "./fechamento-calculator";
import { calcularTotalComEntrega, somarTaxaEntregaAoRateio } from "./total-com-entrega-calculator";

export interface FechamentoResultado {
  comanda: Comanda;
  subtotal: number;
  descontoTipo: DescontoTipo;
  descontoValor: number;
  descontoAplicado: number;
  taxaEntrega: number;
  totalFinal: number;
  divisaoPorIntegrante: RateioIntegranteComDesconto[];
}

export interface FecharComandaParams {
  tenantId: string;
  comandaId: string;
  dto: FecharComandaDto;
  actorPodeConcederDesconto: boolean;
}

// Fecha a comanda dentro da transação do chamador (PED-95). Usada pelo fechamento do caixa
// (ComandaService.fechar) e pela conclusão da entrega (PED-100), que registra o pagamento
// e fecha a comanda na mesma transação.
//
// - Trava a linha da comanda antes de ler: dois fechamentos simultâneos da mesma comanda
//   rodam em fila, e o segundo encontra a comanda já fechada.
// - Lê o extrato pelo `manager`, então enxerga pagamentos gravados antes, na mesma transação.
export async function fecharComandaNaTransacao(
  manager: EntityManager,
  { tenantId, comandaId, dto, actorPodeConcederDesconto }: FecharComandaParams
): Promise<FechamentoResultado> {
  await manager
    .createQueryBuilder(Comanda, "comanda")
    .setLock("pessimistic_write")
    .where("comanda.id = :comandaId", { comandaId })
    .andWhere("comanda.tenantId = :tenantId", { tenantId })
    .getOne();

  const { comanda, calculado, pagamentos } = await carregarExtrato(manager, tenantId, comandaId);

  if (comanda.status !== ComandaStatus.ABERTA) {
    throw new AppError("Esta comanda já está fechada.", 400);
  }

  if (pagamentos.length === 0) {
    throw new AppError("É necessário registrar ao menos um pagamento antes de fechar a comanda.", 400);
  }

  if (dto.descontoTipo !== DescontoTipo.NENHUM && !actorPodeConcederDesconto) {
    throw new AppError("Você não tem permissão para conceder desconto.", 403);
  }

  // Desconto só sobre os itens; a taxa de entrega (0 para mesa) entra depois, inteira.
  const totais = calcularTotalComEntrega(
    calculado.resumo_financeiro.valor_total_comanda,
    { tipo: dto.descontoTipo, valor: dto.descontoValor },
    calculado.resumo_financeiro.taxa_entrega
  );

  const avaliacao = avaliarFechamento(
    totais.total_final,
    pagamentos.map((pagamento) => ({ valor: pagamento.valor }))
  );

  if (!avaliacao.suficiente) {
    throw new AppError(
      `Valor pago (R$ ${fromCents(avaliacao.totalPagoCents).toFixed(2)}) é insuficiente para quitar a comanda (total: R$ ${fromCents(
        avaliacao.totalComandaCents
      ).toFixed(2)}).`,
      400
    );
  }

  const divisaoPorIntegrante = somarTaxaEntregaAoRateio(
    ratearDescontoPorIntegrante(
      calculado.divisao_por_integrante.map((integrante) => ({
        integranteId: integrante.integrante_id,
        nome: integrante.nome,
        totalAPagar: integrante.total_a_pagar,
      })),
      totais.desconto_aplicado
    ),
    totais.taxa_entrega
  );

  // Grava só as colunas do fechamento (sem a relação integrantes carregada no extrato).
  await manager.update(
    Comanda,
    { id: comanda.id, tenantId },
    {
      status: ComandaStatus.FECHADA,
      fechadaEm: new Date(),
      descontoTipo: dto.descontoTipo,
      descontoValor: dto.descontoValor,
      subtotal: totais.subtotal,
      totalFinal: totais.total_final,
    }
  );

  const comandaFechada = await manager.findOneByOrFail(Comanda, { id: comanda.id, tenantId });

  return {
    comanda: comandaFechada,
    subtotal: totais.subtotal,
    descontoTipo: dto.descontoTipo,
    descontoValor: dto.descontoValor,
    descontoAplicado: totais.desconto_aplicado,
    taxaEntrega: totais.taxa_entrega,
    totalFinal: totais.total_final,
    divisaoPorIntegrante,
  };
}
