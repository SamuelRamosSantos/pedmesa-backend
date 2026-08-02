import { ImpressaoService } from "../services/impressao.service";
import { PrintJobPayload } from "../types/print-job.types";

const MAX_TENTATIVAS = 3;
const RETRY_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processar(job: PrintJobPayload): Promise<void> {
  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa += 1) {
    try {
      await ImpressaoService.imprimir(job);
      return;
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : String(error);

      if (tentativa === MAX_TENTATIVAS) {
        console.error(`[PRINT WORKER] Pedido #${job.pedido_id} falhou após ${MAX_TENTATIVAS} tentativas: ${mensagem}`);
        return;
      }

      console.warn(
        `[PRINT WORKER] Tentativa ${tentativa}/${MAX_TENTATIVAS} falhou para o Pedido #${job.pedido_id} (${mensagem}). Nova tentativa em ${RETRY_DELAY_MS}ms.`
      );

      await sleep(RETRY_DELAY_MS);
    }
  }
}

export class PrintQueue {
  static enqueue(job: PrintJobPayload): void {
    setImmediate(() => {
      processar(job).catch((error) => {
        console.error(`[PRINT WORKER] Erro inesperado ao processar o Pedido #${job.pedido_id}:`, error);
      });
    });
  }
}
