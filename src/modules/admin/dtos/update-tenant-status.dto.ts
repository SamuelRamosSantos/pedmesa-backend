import { AppError } from "../../../shared/errors/app-error";
import { TenantStatus } from "../../tenants/entities/tenant.entity";

export interface UpdateTenantStatusDto {
  status: TenantStatus;
}

const STATUS_VALIDOS = Object.values(TenantStatus);

export function assertValidUpdateTenantStatusDto(body: unknown): UpdateTenantStatusDto {
  const { status } = (body ?? {}) as Record<string, unknown>;

  if (typeof status !== "string" || !STATUS_VALIDOS.includes(status as TenantStatus)) {
    throw new AppError(`O campo status deve ser um dos seguintes: ${STATUS_VALIDOS.join(", ")}.`, 400);
  }

  return { status: status as TenantStatus };
}
