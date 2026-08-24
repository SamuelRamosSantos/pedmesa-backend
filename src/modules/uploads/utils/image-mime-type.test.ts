import { describe, expect, it } from "vitest";
import { getExtensionForImageMimeType, isAllowedImageMimeType } from "./image-mime-type";

describe("image-mime-type", () => {
  it("mapeia os tipos de imagem permitidos para a extensão correta", () => {
    expect(getExtensionForImageMimeType("image/jpeg")).toBe("jpg");
    expect(getExtensionForImageMimeType("image/png")).toBe("png");
    expect(getExtensionForImageMimeType("image/webp")).toBe("webp");
  });

  it("retorna null para tipos não suportados", () => {
    expect(getExtensionForImageMimeType("image/gif")).toBeNull();
    expect(getExtensionForImageMimeType("application/pdf")).toBeNull();
    expect(getExtensionForImageMimeType("text/html")).toBeNull();
  });

  it("isAllowedImageMimeType reflete a mesma whitelist", () => {
    expect(isAllowedImageMimeType("image/webp")).toBe(true);
    expect(isAllowedImageMimeType("image/svg+xml")).toBe(false);
  });
});
