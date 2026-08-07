import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error";
import { getTenantId } from "../../../shared/utils/get-tenant-id";
import { isUuid } from "../../../shared/utils/is-uuid";
import { assertValidUpdateStatusFilaDto } from "../dtos/update-status-fila.dto";
import { toFilaImpressaoResponse } from "../mappers/fila-impressao.mapper";
import { FilaImpressaoService } from "../services/fila-impressao.service";

export async function listPendentes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const jobs = await FilaImpressaoService.listPendentes(tenantId);

    res.status(200).json(jobs.map(toFilaImpressaoResponse));
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    if (!isUuid(id)) {
      throw new AppError("ID de job de impressão inválido.", 400);
    }

    const dto = assertValidUpdateStatusFilaDto(req.body);
    const job = await FilaImpressaoService.updateStatus(tenantId, id, dto);

    res.status(200).json(toFilaImpressaoResponse(job));
  } catch (error) {
    next(error);
  }
}
