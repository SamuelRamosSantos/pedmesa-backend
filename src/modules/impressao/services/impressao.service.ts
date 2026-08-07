import { enviarParaImpressora } from "../drivers/escpos-tcp.driver";
import { Impressora } from "../entities/impressora.entity";
import { construirComandosEscPos } from "../formatters/escpos-commands";
import { formatarTicket } from "../formatters/ticket.formatter";
import { PrintJobPayload } from "../types/print-job.types";

export class ImpressaoService {
  static async imprimir(job: PrintJobPayload, impressoras: Impressora[]): Promise<void> {
    if (impressoras.length === 0) {
      return;
    }

    const comandos = construirComandosEscPos(formatarTicket(job));

    await Promise.all(
      impressoras.map((impressora) => enviarParaImpressora({ ip: impressora.ip, porta: impressora.porta }, comandos))
    );
  }
}
