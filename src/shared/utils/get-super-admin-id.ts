import { Request } from "express";
import { AppError } from "../errors/app-error";

export function getSuperAdminId(req: Request): string {
  if (!req.superAdmin) {
    throw new AppError("Super-admin não identificado na requisição.", 401);
  }

  return req.superAdmin.id;
}
