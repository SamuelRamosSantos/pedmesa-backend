export interface TipoImagem {
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  extension: "jpg" | "png" | "webp";
}

const ASSINATURA_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const ASSINATURA_JPEG = [0xff, 0xd8, 0xff];

function comecaCom(buffer: Buffer, bytes: number[], inicio = 0): boolean {
  return bytes.every((byte, indice) => buffer[inicio + indice] === byte);
}

function textoEm(buffer: Buffer, inicio: number, texto: string): boolean {
  return (
    buffer.subarray(inicio, inicio + texto.length).toString("latin1") === texto
  );
}

/**
 * Descobre o tipo real da imagem pela assinatura no início do arquivo, sem
 * confiar no Content-Type que o cliente declarou. Devolve null para qualquer
 * coisa que não seja JPEG, PNG ou WebP.
 */
export function detectarTipoImagem(buffer: Buffer): TipoImagem | null {
  if (comecaCom(buffer, ASSINATURA_PNG)) {
    return { mimeType: "image/png", extension: "png" };
  }

  if (comecaCom(buffer, ASSINATURA_JPEG)) {
    return { mimeType: "image/jpeg", extension: "jpg" };
  }

  // WebP: "RIFF" + 4 bytes de tamanho + "WEBP"
  if (textoEm(buffer, 0, "RIFF") && textoEm(buffer, 8, "WEBP")) {
    return { mimeType: "image/webp", extension: "webp" };
  }

  return null;
}
