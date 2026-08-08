// Impressora térmica TCP falsa para testar o pipeline de impressão
// (ImpressaoService -> escpos-commands -> driver TCP) sem hardware real.
//
// Uso:
//   node scripts/dev/mock-tcp-printer.cjs [porta]
//
// Depois, cadastre uma impressora apontando pra cá:
//   POST /api/v1/impressao/impressoras  { "nome": "Mock", "ip": "127.0.0.1", "porta": 19100 }
//
// Cada job recebido é logado (tamanho + timestamp) e os bytes crus são
// acumulados em mock-printer-received.bin, na mesma pasta deste script.
// Apague o .bin/.log entre execuções se quiser recomeçar do zero.

const net = require("net");
const fs = require("fs");
const path = require("path");

const PORTA = Number(process.argv[2]) || 19100;
const OUT_BIN = path.join(__dirname, "mock-printer-received.bin");
const OUT_LOG = path.join(__dirname, "mock-printer-received.log");

const server = net.createServer((socket) => {
  const partes = [];
  socket.on("data", (chunk) => partes.push(chunk));
  socket.on("end", () => {
    const dados = Buffer.concat(partes);
    fs.appendFileSync(OUT_BIN, dados);
    fs.appendFileSync(OUT_LOG, `--- job recebido (${dados.length} bytes) em ${new Date().toISOString()} ---\n`);
    console.log(`[MOCK PRINTER] recebido ${dados.length} bytes`);
  });
});

server.listen(PORTA, "127.0.0.1", () => {
  console.log(`[MOCK PRINTER] escutando em 127.0.0.1:${PORTA}`);
});
