const ESC = 0x1b;
const GS = 0x1d;

const INIT = Buffer.from([ESC, 0x40]); // ESC @ — inicializa a impressora
const AVANCO_LINHAS = Buffer.from([0x0a, 0x0a, 0x0a]); // avança papel antes do corte
const CORTE_TOTAL = Buffer.from([GS, 0x56, 0x00]); // GS V 0 — corte total do papel

// Impressoras térmicas ESC/POS tipicamente usam uma codepage de 1 byte (ex.: CP860/CP850)
// para acentuação em português — latin1 é a aproximação mais próxima disponível nativamente
// no Buffer do Node sem depender de uma tabela de codepage específica do fabricante.
export function construirComandosEscPos(texto: string): Buffer {
  const corpo = Buffer.from(`${texto}\n`, "latin1");

  return Buffer.concat([INIT, corpo, AVANCO_LINHAS, CORTE_TOTAL]);
}
