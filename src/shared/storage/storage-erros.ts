import { AppError } from "../errors/app-error";

export function uploadPendenteInvalido(): AppError {
  return new AppError(
    "Imagem inválida: envie a imagem por POST /uploads antes de salvar.",
    400,
  );
}

export function uploadExpirado(): AppError {
  return new AppError(
    "A imagem enviada expirou. Escolha a imagem de novo e salve.",
    400,
  );
}
