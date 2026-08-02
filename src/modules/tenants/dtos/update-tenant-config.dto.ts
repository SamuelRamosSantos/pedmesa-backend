import { AppError } from "../../../shared/errors/app-error";

export interface UpdateTenantConfigDto {
  quantidadeComandas: number;
}

export function assertValidUpdateTenantConfigDto(body: unknown): UpdateTenantConfigDto {
  const { quantidade_comandas: quantidadeComandas } = (body ?? {}) as Record<string, unknown>;

  if (typeof quantidadeComandas !== "number" || !Number.isInteger(quantidadeComandas) || quantidadeComandas <= 0) {
    throw new AppError("quantidade_comandas deve ser um número inteiro maior que zero.", 400);
  }

  return { quantidadeComandas };
}
