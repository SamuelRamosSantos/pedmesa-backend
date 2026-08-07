import { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../../config/data-source";
import { Tenant } from "../../modules/tenants/entities/tenant.entity";
import { AppError } from "../errors/app-error";

export async function agentAuthMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = req.headers["x-agent-token"];

  if (typeof token !== "string" || token.trim().length === 0) {
    next(new AppError("Token do agente não informado.", 401));
    return;
  }

  try {
    const tenantRepository = AppDataSource.getRepository(Tenant);
    const tenant = await tenantRepository.findOne({ where: { tokenAgente: token } });

    if (!tenant) {
      next(new AppError("Token do agente inválido.", 401));
      return;
    }

    req.tenantId = tenant.id;
    next();
  } catch (error) {
    next(error);
  }
}
