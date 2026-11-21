import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error";
import { getStorageService } from "../../../shared/storage/get-storage-service";
import { getTenantId } from "../../../shared/utils/get-tenant-id";
import { detectarTipoImagem } from "../utils/detect-image-type";

const TIPO_NAO_PERMITIDO =
  "Tipo de arquivo não permitido. Envie um arquivo JPG, PNG ou WEBP.";

export async function uploadImagem(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.file) {
      throw new AppError("Nenhum arquivo enviado.", 400);
    }

    // O Content-Type declarado pelo cliente já passou pelo filtro do multer, mas
    // quem decide o tipo (e o Content-Type gravado no storage) são os bytes.
    const tipo = detectarTipoImagem(req.file.buffer);

    if (!tipo) {
      throw new AppError(TIPO_NAO_PERMITIDO, 400);
    }

    const url = await getStorageService().upload({
      tenantId: getTenantId(req),
      buffer: req.file.buffer,
      mimeType: tipo.mimeType,
      extension: tipo.extension,
    });

    res.status(201).json({ url });
  } catch (error) {
    next(error);
  }
}
