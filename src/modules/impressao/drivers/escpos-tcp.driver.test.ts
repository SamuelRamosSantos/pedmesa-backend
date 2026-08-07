import { createServer, Server } from "net";
import { afterEach, describe, expect, it } from "vitest";
import { enviarParaImpressora } from "./escpos-tcp.driver";

function iniciarServidorMock(onDados: (dados: Buffer) => void): Promise<{ server: Server; porta: number }> {
  return new Promise((resolve) => {
    const server = createServer((socket) => {
      const partes: Buffer[] = [];
      socket.on("data", (chunk) => partes.push(chunk));
      socket.on("end", () => onDados(Buffer.concat(partes)));
    });

    server.listen(0, "127.0.0.1", () => {
      const endereco = server.address();
      const porta = typeof endereco === "object" && endereco !== null ? endereco.port : 0;
      resolve({ server, porta });
    });
  });
}

describe("enviarParaImpressora", () => {
  let servidorAtivo: Server | null = null;

  afterEach(async () => {
    if (servidorAtivo) {
      await new Promise<void>((resolve) => servidorAtivo!.close(() => resolve()));
      servidorAtivo = null;
    }
  });

  it("envia exatamente os bytes informados para a impressora", async () => {
    const comandos = Buffer.from([0x1b, 0x40, 0x41, 0x42, 0x43]);
    const bytesRecebidos = await new Promise<Buffer>(async (resolve) => {
      const { server, porta } = await iniciarServidorMock((dados) => resolve(dados));
      servidorAtivo = server;

      await enviarParaImpressora({ ip: "127.0.0.1", porta }, comandos);
    });

    expect(bytesRecebidos).toEqual(comandos);
  });

  it("rejeita quando a impressora está offline (conexão recusada)", async () => {
    // porta alta improvável de ter algo escutando neste ambiente de teste
    await expect(enviarParaImpressora({ ip: "127.0.0.1", porta: 1 }, Buffer.from("x"))).rejects.toThrow(
      /Falha de comunicação/
    );
  });

  it("rejeita por timeout quando a conexão não responde a tempo", async () => {
    // 10.255.255.1 é um IP não roteável nesta rede de teste, então a conexão vai
    // ficar pendurada até estourar o timeout (usamos um timeout bem curto pra não
    // deixar o teste lento).
    await expect(
      enviarParaImpressora({ ip: "10.255.255.1", porta: 9100 }, Buffer.from("x"), 200)
    ).rejects.toThrow();
  }, 2000);
});
