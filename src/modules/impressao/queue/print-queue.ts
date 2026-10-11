import { AppDataSource } from "../../../config/data-source";
import { FilaImpressao, StatusFilaImpressao, TipoFilaImpressao } from "../entities/fila-impressao.entity";
import { Impressora } from "../entities/impressora.entity";
import { formatarEntrega } from "../formatters/entrega.formatter";
import { identificacaoDoPedido } from "../formatters/formatacao";
import { formatarPreConta } from "../formatters/preconta.formatter";
import { formatarTicket } from "../formatters/ticket.formatter";
import { ImpressaoService } from "../services/impressao.service";
import { EntregaJobPayload, PreContaJobPayload, PrintJobPayload } from "../types/print-job.types";

const MAX_TENTATIVAS = 3;
const RETRY_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Escolhe o formatter pelo tipo do job. O pedmesa-print-agent tem a mesma escolha no
// poller.js (formatarTextoDoJob): um tipo novo precisa entrar nos dois lugares.
function formatarTextoDoJob(job: FilaImpressao): string {
  switch (job.tipo) {
    case TipoFilaImpressao.PRE_CONTA:
      if (job.numeroComanda === null) {
        throw new Error(`Job de pré-conta ${job.id} sem número de mesa.`);
      }

      return formatarPreConta({
        tenant_id: job.tenantId,
        comanda_id: job.comandaId ?? "",
        numero_comanda: job.numeroComanda,
        gerado_em: job.criadoEm,
        itens: job.payload,
        valor_total: job.valorTotal ?? 0,
      });

    case TipoFilaImpressao.ENTREGA:
      if (job.numeroEntrega === null || job.dadosEntrega === null) {
        throw new Error(`Job de entrega ${job.id} sem número ou sem dados da entrega.`);
      }

      return formatarEntrega({
        tenant_id: job.tenantId,
        comanda_id: job.comandaId ?? "",
        numero_entrega: job.numeroEntrega,
        gerado_em: job.criadoEm,
        itens: job.payload,
        dados: job.dadosEntrega,
      });

    case TipoFilaImpressao.PEDIDO_COZINHA:
      return formatarTicket({
        tenant_id: job.tenantId,
        comanda_id: job.comandaId ?? "",
        pedido_id: job.pedidoId ?? "",
        numero_comanda: job.numeroComanda,
        numero_entrega: job.numeroEntrega,
        criado_em: job.criadoEm,
        itens: job.payload,
      });
  }
}

function identificarJob(job: FilaImpressao): string {
  const pedido = identificacaoDoPedido(job.numeroComanda, job.numeroEntrega);

  switch (job.tipo) {
    case TipoFilaImpressao.PRE_CONTA:
      return `Pré-conta (${pedido})`;
    case TipoFilaImpressao.ENTREGA:
      return `Cupom de entrega (${pedido})`;
    case TipoFilaImpressao.PEDIDO_COZINHA:
      return `Pedido #${job.pedidoId} (${pedido})`;
  }
}

async function processar(filaImpressaoId: string): Promise<void> {
  const filaRepository = AppDataSource.getRepository(FilaImpressao);
  const job = await filaRepository.findOne({ where: { id: filaImpressaoId } });

  if (!job) {
    return;
  }

  const impressoraRepository = AppDataSource.getRepository(Impressora);
  const impressoras = await impressoraRepository.find({ where: { tenantId: job.tenantId, ativo: true } });

  if (impressoras.length === 0) {
    return;
  }

  const texto = formatarTextoDoJob(job);
  const identificador = identificarJob(job);

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa += 1) {
    try {
      await ImpressaoService.imprimir(texto, impressoras);

      job.status = StatusFilaImpressao.ENVIADO;
      job.tentativas = tentativa;
      job.erroMensagem = null;
      await filaRepository.save(job);
      return;
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : String(error);

      if (tentativa === MAX_TENTATIVAS) {
        console.error(`[PRINT WORKER] ${identificador} falhou após ${MAX_TENTATIVAS} tentativas: ${mensagem}`);

        job.status = StatusFilaImpressao.FALHOU;
        job.tentativas = tentativa;
        job.erroMensagem = mensagem;
        await filaRepository.save(job);
        return;
      }

      console.warn(
        `[PRINT WORKER] Tentativa ${tentativa}/${MAX_TENTATIVAS} falhou para ${identificador} (${mensagem}). Nova tentativa em ${RETRY_DELAY_MS}ms.`
      );

      await sleep(RETRY_DELAY_MS);
    }
  }
}

function enfileirar(filaImpressao: FilaImpressao, identificador: string): void {
  setImmediate(() => {
    processar(filaImpressao.id).catch((error) => {
      console.error(`[PRINT WORKER] Erro inesperado ao processar ${identificador}:`, error);
    });
  });
}

export class PrintQueue {
  static async enqueuePedidoCozinha(job: PrintJobPayload): Promise<void> {
    const filaRepository = AppDataSource.getRepository(FilaImpressao);

    const filaImpressao = await filaRepository.save(
      filaRepository.create({
        tenantId: job.tenant_id,
        tipo: TipoFilaImpressao.PEDIDO_COZINHA,
        comandaId: job.comanda_id,
        pedidoId: job.pedido_id,
        numeroComanda: job.numero_comanda,
        numeroEntrega: job.numero_entrega,
        payload: job.itens,
      })
    );

    enfileirar(filaImpressao, identificarJob(filaImpressao));
  }

  // Cupom do motoboy (PED-102).
  static async enqueueEntrega(job: EntregaJobPayload): Promise<void> {
    const filaRepository = AppDataSource.getRepository(FilaImpressao);

    const filaImpressao = await filaRepository.save(
      filaRepository.create({
        tenantId: job.tenant_id,
        tipo: TipoFilaImpressao.ENTREGA,
        comandaId: job.comanda_id,
        pedidoId: null,
        numeroComanda: null,
        numeroEntrega: job.numero_entrega,
        payload: job.itens,
        valorTotal: job.dados.total,
        dadosEntrega: job.dados,
      })
    );

    enfileirar(filaImpressao, identificarJob(filaImpressao));
  }

  static async enqueuePreConta(job: PreContaJobPayload): Promise<void> {
    const filaRepository = AppDataSource.getRepository(FilaImpressao);

    const filaImpressao = await filaRepository.save(
      filaRepository.create({
        tenantId: job.tenant_id,
        tipo: TipoFilaImpressao.PRE_CONTA,
        comandaId: job.comanda_id,
        pedidoId: null,
        numeroComanda: job.numero_comanda,
        payload: job.itens,
        valorTotal: job.valor_total,
      })
    );

    enfileirar(filaImpressao, identificarJob(filaImpressao));
  }
}
