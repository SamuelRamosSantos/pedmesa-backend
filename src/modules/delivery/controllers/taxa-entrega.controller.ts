import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error";
import { getTenantId } from "../../../shared/utils/get-tenant-id";
import { isUuid } from "../../../shared/utils/is-uuid";
import { assertValidCreateTaxaEntregaDto } from "../dtos/create-taxa-entrega.dto";
import { assertValidUpdateTaxaEntregaDto } from "../dtos/update-taxa-entrega.dto";
import { toTaxaEntregaResponse } from "../mappers/taxa-entrega.mapper";
import { TaxaEntregaService } from "../services/taxa-entrega.service";

function exigirIdTaxa(id: string): string {
  if (!isUuid(id)) {
    throw new AppError("ID de taxa de entrega inválido.", 400);
  }

  return id;
}

export async function listTaxas(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const taxas = await TaxaEntregaService.listar(getTenantId(req));

    res.status(200).json(taxas.map(toTaxaEntregaResponse));
  } catch (error) {
    next(error);
  }
}

export async function createTaxa(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const dto = assertValidCreateTaxaEntregaDto(req.body);
    const taxa = await TaxaEntregaService.criar(tenantId, dto);

    res.status(201).json(toTaxaEntregaResponse(taxa));
  } catch (error) {
    next(error);
  }
}

export async function updateTaxa(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const taxaId = exigirIdTaxa(req.params.id);
    const dto = assertValidUpdateTaxaEntregaDto(req.body);
    const taxa = await TaxaEntregaService.atualizar(tenantId, taxaId, dto);

    res.status(200).json(toTaxaEntregaResponse(taxa));
  } catch (error) {
    next(error);
  }
}

export async function removeTaxa(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await TaxaEntregaService.remover(getTenantId(req), exigirIdTaxa(req.params.id));

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
