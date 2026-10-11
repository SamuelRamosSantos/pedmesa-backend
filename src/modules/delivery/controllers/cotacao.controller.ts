import { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../../../config/data-source";
import { getTenantId } from "../../../shared/utils/get-tenant-id";
import { assertValidCotacaoDeliveryDto } from "../dtos/cotacao-delivery.dto";
import { toCotacaoResponse } from "../mappers/cotacao.mapper";
import { cotarPedidoDelivery } from "../services/cotacao.service";

export async function cotar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const dto = assertValidCotacaoDeliveryDto(req.body);
    const cotacao = await cotarPedidoDelivery(AppDataSource.manager, tenantId, dto);

    res.status(200).json(toCotacaoResponse(cotacao));
  } catch (error) {
    next(error);
  }
}
