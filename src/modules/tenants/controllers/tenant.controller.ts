import { NextFunction, Request, Response } from "express";
import { getTenantId } from "../../../shared/utils/get-tenant-id";
import { assertValidUpdateTenantConfigDto } from "../dtos/update-tenant-config.dto";
import { toTenantResponse } from "../mappers/tenant.mapper";
import { TenantService } from "../services/tenant.service";

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const tenant = await TenantService.getMe(tenantId);

    res.status(200).json(toTenantResponse(tenant));
  } catch (error) {
    next(error);
  }
}

export async function updateConfiguracoes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const dto = assertValidUpdateTenantConfigDto(req.body);
    const tenant = await TenantService.updateConfiguracoes(tenantId, dto.quantidadeComandas);

    res.status(200).json(toTenantResponse(tenant));
  } catch (error) {
    next(error);
  }
}
