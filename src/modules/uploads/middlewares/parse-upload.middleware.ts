import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { AppError } from "../../../shared/errors/app-error";
import { isAllowedImageMimeType } from "../utils/image-mime-type";

export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
  fileFilter: (_req, file, callback) => {
    if (!isAllowedImageMimeType(file.mimetype)) {
      callback(new Error("Tipo de arquivo não permitido. Envie um arquivo JPG, PNG ou WEBP."));
      return;
    }

    callback(null, true);
  },
});

// Multer é baseado em callback, não em Promise — esse wrapper existe pra converter
// tanto os erros dele (ex.: LIMIT_FILE_SIZE) quanto os do fileFilter em AppError(400),
// que é o formato que o errorHandlerMiddleware global sabe responder corretamente
// (sem isso, cairia no branch genérico de 500).
export function parseUploadedFile(req: Request, res: Response, next: NextFunction): void {
  upload.single("file")(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(new AppError("Arquivo maior que o limite de 5MB.", 400));
      return;
    }

    next(
      new AppError(error instanceof Error ? error.message : "Não foi possível processar o arquivo enviado.", 400)
    );
  });
}
