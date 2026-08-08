import { AppDataSource } from "../../../config/data-source";
import { FilaImpressao, StatusFilaImpressao, TipoFilaImpressao } from "../entities/fila-impressao.entity";
import { Impressora } from "../entities/impressora.entity";
import { formatarPreConta } from "../formatters/preconta.formatter";
import { formatarTicket } from "../formatters/ticket.formatter";
import { ImpressaoService } from "../services/impressao.service";
import { PreContaJobPayload, PrintJobPayload } from "../types/print-job.types";

const MAX_TENTATIVAS = 3;
const RETRY_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatarTextoDoJob(job: FilaImpressao): string {
  if (job.tipo === TipoFilaImpressao.PRE_CONTA) {
    return formatarPreConta({
      tenant_id: job.tenantId,
      comanda_id: job.comandaId ?? "",
      numero_comanda: job.numeroComanda,
      gerado_em: job.criadoEm,
      itens: job.payload,
      valor_total: job.valorTotal ?? 0,
    });
  }

  return formatarTicket({
    tenant_id: job.tenantId,
    comanda_id: job.comandaId ?? "",
    pedido_id: job.pedidoId ?? "",
    numero_comanda: job.numeroComanda,
    criado_em: job.criadoEm,
    itens: job.payload,
  });
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
  const identificador = job.tipo === TipoFilaImpressao.PRE_CONTA ? `Pré-conta da mesa #${job.numeroComanda}` : `Pedido #${job.pedidoId}`;

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
        payload: job.itens,
      })
    );

    enfileirar(filaImpressao, `Pedido #${job.pedido_id}`);
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

    enfileirar(filaImpressao, `Pré-conta da mesa #${job.numero_comanda}`);
  }
}
