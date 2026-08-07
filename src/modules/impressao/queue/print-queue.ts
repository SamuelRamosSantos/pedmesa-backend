import { AppDataSource } from "../../../config/data-source";
import { FilaImpressao, StatusFilaImpressao } from "../entities/fila-impressao.entity";
import { Impressora } from "../entities/impressora.entity";
import { ImpressaoService } from "../services/impressao.service";
import { PrintJobPayload } from "../types/print-job.types";

const MAX_TENTATIVAS = 3;
const RETRY_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  const payload: PrintJobPayload = {
    tenant_id: job.tenantId,
    pedido_id: job.pedidoId,
    numero_comanda: job.numeroComanda,
    criado_em: job.criadoEm,
    itens: job.payload,
  };

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa += 1) {
    try {
      await ImpressaoService.imprimir(payload, impressoras);

      job.status = StatusFilaImpressao.ENVIADO;
      job.tentativas = tentativa;
      job.erroMensagem = null;
      await filaRepository.save(job);
      return;
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : String(error);

      if (tentativa === MAX_TENTATIVAS) {
        console.error(`[PRINT WORKER] Pedido #${job.pedidoId} falhou após ${MAX_TENTATIVAS} tentativas: ${mensagem}`);

        job.status = StatusFilaImpressao.FALHOU;
        job.tentativas = tentativa;
        job.erroMensagem = mensagem;
        await filaRepository.save(job);
        return;
      }

      console.warn(
        `[PRINT WORKER] Tentativa ${tentativa}/${MAX_TENTATIVAS} falhou para o Pedido #${job.pedidoId} (${mensagem}). Nova tentativa em ${RETRY_DELAY_MS}ms.`
      );

      await sleep(RETRY_DELAY_MS);
    }
  }
}

export class PrintQueue {
  static async enqueue(job: PrintJobPayload): Promise<void> {
    const filaRepository = AppDataSource.getRepository(FilaImpressao);

    const filaImpressao = await filaRepository.save(
      filaRepository.create({
        tenantId: job.tenant_id,
        pedidoId: job.pedido_id,
        numeroComanda: job.numero_comanda,
        payload: job.itens,
      })
    );

    setImmediate(() => {
      processar(filaImpressao.id).catch((error) => {
        console.error(`[PRINT WORKER] Erro inesperado ao processar o Pedido #${job.pedido_id}:`, error);
      });
    });
  }
}
