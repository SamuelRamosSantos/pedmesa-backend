import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error";
import { getStorageService } from "../../../shared/storage/get-storage-service";
import { getExtensionForImageMimeType } from "../utils/image-mime-type";

export async function uploadImagem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      throw new AppError("Nenhum arquivo enviado.", 400);
    }

    const extension = getExtensionForImageMimeType(req.file.mimetype);

    if (!extension) {
      throw new AppError("Tipo de arquivo não permitido. Envie um arquivo JPG, PNG ou WEBP.", 400);
    }

    const storageService = getStorageService();
    const url = await storageService.upload({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      extension,
    });

    res.status(201).json({ url });
  } catch (error) {
    next(error);
  }
}
