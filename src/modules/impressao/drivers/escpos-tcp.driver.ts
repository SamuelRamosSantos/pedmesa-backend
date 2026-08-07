import { Socket } from "net";

export interface DestinoImpressora {
  ip: string;
  porta: number;
}

const TIMEOUT_PADRAO_MS = 5000;

export function enviarParaImpressora(
  destino: DestinoImpressora,
  comandos: Buffer,
  timeoutMs: number = TIMEOUT_PADRAO_MS
): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    let finalizado = false;

    function finalizar(erro?: Error) {
      if (finalizado) {
        return;
      }

      finalizado = true;
      socket.destroy();

      if (erro) {
        reject(erro);
      } else {
        resolve();
      }
    }

    socket.setTimeout(timeoutMs);

    socket.once("timeout", () => {
      finalizar(new Error(`Timeout ao conectar à impressora ${destino.ip}:${destino.porta}.`));
    });

    socket.once("error", (erro) => {
      finalizar(new Error(`Falha de comunicação com a impressora ${destino.ip}:${destino.porta}: ${erro.message}`));
    });

    socket.connect(destino.porta, destino.ip, () => {
      socket.end(comandos, () => {
        finalizar();
      });
    });
  });
}
