import { formatarTicket } from "../formatters/ticket.formatter";
import { PrintJobPayload } from "../types/print-job.types";

const SIMULATED_PRINTER_LATENCY_MS = 50;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// PRINT_FAILURE_RATE (0 a 1) permite simular uma impressora térmica instável em
// ambiente de desenvolvimento/demo, exercitando o retry do PrintQueue. Fica em 0
// (nunca falha) a menos que explicitamente configurada.
function deveSimularFalha(): boolean {
  const taxa = Number.parseFloat(process.env.PRINT_FAILURE_RATE ?? "0");
  return taxa > 0 && Math.random() < taxa;
}

export class ImpressaoService {
  static async imprimir(job: PrintJobPayload): Promise<void> {
    await sleep(SIMULATED_PRINTER_LATENCY_MS);

    if (deveSimularFalha()) {
      throw new Error("Falha simulada de comunicação com a impressora (offline ou sem papel).");
    }

    console.log(formatarTicket(job));
    console.log(`[PRINT WORKER] Impressão enviada com sucesso para Pedido #${job.pedido_id}`);
  }
}
