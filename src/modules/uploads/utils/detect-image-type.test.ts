import { describe, expect, it } from "vitest";
import { detectarTipoImagem } from "./detect-image-type";

const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const WEBP = Buffer.concat([
  Buffer.from("RIFF", "latin1"),
  Buffer.from([0x24, 0x00, 0x00, 0x00]),
  Buffer.from("WEBPVP8 ", "latin1"),
]);

describe("detectarTipoImagem", () => {
  it("reconhece PNG, JPEG e WebP pela assinatura", () => {
    expect(detectarTipoImagem(PNG)).toEqual({
      mimeType: "image/png",
      extension: "png",
    });
    expect(detectarTipoImagem(JPEG)).toEqual({
      mimeType: "image/jpeg",
      extension: "jpg",
    });
    expect(detectarTipoImagem(WEBP)).toEqual({
      mimeType: "image/webp",
      extension: "webp",
    });
  });

  it("recusa texto, HTML, SVG, GIF e arquivos vazios", () => {
    expect(detectarTipoImagem(Buffer.from("não sou uma imagem"))).toBeNull();
    expect(detectarTipoImagem(Buffer.from("<html><script>"))).toBeNull();
    expect(detectarTipoImagem(Buffer.from("<svg xmlns="))).toBeNull();
    expect(detectarTipoImagem(Buffer.from("GIF89a"))).toBeNull();
    expect(detectarTipoImagem(Buffer.alloc(0))).toBeNull();
  });

  it("não confunde outro arquivo RIFF (ex.: WAV) com WebP", () => {
    const wav = Buffer.concat([
      Buffer.from("RIFF", "latin1"),
      Buffer.from([0x24, 0x00, 0x00, 0x00]),
      Buffer.from("WAVE", "latin1"),
    ]);

    expect(detectarTipoImagem(wav)).toBeNull();
  });
});
