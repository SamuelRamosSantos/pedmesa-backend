import { AppError } from "../../../shared/errors/app-error";
import { TenantStatus } from "../../tenants/entities/tenant.entity";

export interface ListTenantsFilters {
  status: TenantStatus | null;
  nome: string | null;
}

const STATUS_VALIDOS = Object.values(TenantStatus);

export function parseListTenantsFilters(query: Record<string, unknown>): ListTenantsFilters {
  const { status, nome } = query;

  if (status !== undefined && !STATUS_VALIDOS.includes(status as TenantStatus)) {
    throw new AppError(`O parâmetro status deve ser um dos seguintes: ${STATUS_VALIDOS.join(", ")}.`, 400);
  }

  return {
    status: typeof status === "string" ? (status as TenantStatus) : null,
    nome: typeof nome === "string" && nome.trim().length > 0 ? nome.trim() : null,
  };
}
