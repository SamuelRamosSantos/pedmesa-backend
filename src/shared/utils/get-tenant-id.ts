import { Request } from "express";
import { AppError } from "../errors/app-error";

export function getTenantId(req: Request): string {
  if (!req.tenantId) {
    throw new AppError("Tenant não identificado na requisição.", 401);
  }

  return req.tenantId;
}
