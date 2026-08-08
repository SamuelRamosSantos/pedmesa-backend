import { enviarParaImpressora } from "../drivers/escpos-tcp.driver";
import { Impressora } from "../entities/impressora.entity";
import { construirComandosEscPos } from "../formatters/escpos-commands";

export class ImpressaoService {
  static async imprimir(texto: string, impressoras: Impressora[]): Promise<void> {
    if (impressoras.length === 0) {
      return;
    }

    const comandos = construirComandosEscPos(texto);

    await Promise.all(
      impressoras.map((impressora) => enviarParaImpressora({ ip: impressora.ip, porta: impressora.porta }, comandos))
    );
  }
}
