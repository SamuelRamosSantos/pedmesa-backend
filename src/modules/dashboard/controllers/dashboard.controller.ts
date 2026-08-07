import { NextFunction, Request, Response } from "express";
import { getTenantId } from "../../../shared/utils/get-tenant-id";
import { assertValidDashboardFiltroDto } from "../dtos/dashboard-filtro.dto";
import { toDashboardResponse } from "../mappers/dashboard.mapper";
import { DashboardService } from "../services/dashboard.service";
import { resolverIntervaloPeriodo } from "../services/periodo-resolver";

export async function getResumo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const dto = assertValidDashboardFiltroDto(req.query);
    const intervalo = resolverIntervaloPeriodo(dto);

    const [resumo, produtos, historico] = await Promise.all([
      DashboardService.getResumo(tenantId, intervalo),
      DashboardService.getProdutosMaisPedidos(tenantId, intervalo),
      DashboardService.getHistoricoComandas(tenantId, intervalo),
    ]);

    res.status(200).json(toDashboardResponse(dto.periodo, resumo, produtos, historico));
  } catch (error) {
    next(error);
  }
}
