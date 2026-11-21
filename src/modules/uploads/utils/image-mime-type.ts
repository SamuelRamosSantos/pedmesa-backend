const MIME_TYPE_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function getExtensionForImageMimeType(mimeType: string): string | null {
  return MIME_TYPE_TO_EXTENSION[mimeType] ?? null;
}

export function isAllowedImageMimeType(mimeType: string): boolean {
  return mimeType in MIME_TYPE_TO_EXTENSION;
}
