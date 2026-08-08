import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error";
import { getSuperAdminId } from "../../../shared/utils/get-super-admin-id";
import { isUuid } from "../../../shared/utils/is-uuid";
import { assertValidCreateTenantDto } from "../dtos/create-tenant.dto";
import { parseListTenantsFilters } from "../dtos/list-tenants.dto";
import { assertValidUpdateTenantDto } from "../dtos/update-tenant.dto";
import { assertValidUpdateTenantStatusDto } from "../dtos/update-tenant-status.dto";
import { toTenantAdminResponse } from "../mappers/tenant-admin.mapper";
import { SuperAdminService } from "../services/super-admin.service";

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = assertValidCreateTenantDto(req.body);
    const tenant = await SuperAdminService.criarTenant(dto);

    res.status(201).json(toTenantAdminResponse(tenant));
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filters = parseListTenantsFilters(req.query as Record<string, unknown>);
    const tenants = await SuperAdminService.listarTenants(filters);

    res.status(200).json(tenants.map(toTenantAdminResponse));
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    if (!isUuid(id)) {
      throw new AppError("ID de estabelecimento inválido.", 400);
    }

    const dto = assertValidUpdateTenantDto(req.body);
    const tenant = await SuperAdminService.atualizarTenant(id, dto);

    res.status(200).json(toTenantAdminResponse(tenant));
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    if (!isUuid(id)) {
      throw new AppError("ID de estabelecimento inválido.", 400);
    }

    const dto = assertValidUpdateTenantStatusDto(req.body);
    const tenant = await SuperAdminService.atualizarStatus(id, dto.status);

    res.status(200).json(toTenantAdminResponse(tenant));
  } catch (error) {
    next(error);
  }
}

export async function impersonar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    if (!isUuid(id)) {
      throw new AppError("ID de estabelecimento inválido.", 400);
    }

    const superAdminId = getSuperAdminId(req);
    const resultado = await SuperAdminService.impersonarTenant(id, superAdminId);

    res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
}
