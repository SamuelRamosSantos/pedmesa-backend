import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error";
import { getTenantId } from "../../../shared/utils/get-tenant-id";
import { isUuid } from "../../../shared/utils/is-uuid";
import { assertValidCreateImpressoraDto } from "../dtos/create-impressora.dto";
import { assertValidUpdateImpressoraDto } from "../dtos/update-impressora.dto";
import { toImpressoraResponse } from "../mappers/impressora.mapper";
import { ImpressoraService } from "../services/impressora.service";

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const impressoras = await ImpressoraService.list(tenantId);

    res.status(200).json(impressoras.map(toImpressoraResponse));
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const dto = assertValidCreateImpressoraDto(req.body);
    const impressora = await ImpressoraService.create(tenantId, dto);

    res.status(201).json(toImpressoraResponse(impressora));
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    if (!isUuid(id)) {
      throw new AppError("ID de impressora inválido.", 400);
    }

    const dto = assertValidUpdateImpressoraDto(req.body);
    const impressora = await ImpressoraService.update(tenantId, id, dto);

    res.status(200).json(toImpressoraResponse(impressora));
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    if (!isUuid(id)) {
      throw new AppError("ID de impressora inválido.", 400);
    }

    await ImpressoraService.delete(tenantId, id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
