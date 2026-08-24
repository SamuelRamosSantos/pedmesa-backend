export interface UploadFileInput {
  buffer: Buffer;
  mimeType: string;
  extension: string;
}

export interface StorageService {
  upload(input: UploadFileInput): Promise<string>;
}
