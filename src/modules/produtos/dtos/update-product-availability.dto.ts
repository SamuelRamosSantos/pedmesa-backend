import { AppError } from "../../../shared/errors/app-error";

export interface UpdateProductAvailabilityDto {
  disponivel: boolean;
}

export function assertValidUpdateAvailabilityDto(body: unknown): UpdateProductAvailabilityDto {
  const { disponivel } = (body ?? {}) as Record<string, unknown>;

  if (typeof disponivel !== "boolean") {
    throw new AppError("Campo disponivel é obrigatório e deve ser booleano.", 400);
  }

  return { disponivel };
}
