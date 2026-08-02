import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error";
import { getTenantId } from "../../../shared/utils/get-tenant-id";
import { getUserId } from "../../../shared/utils/get-user-id";
import { isUuid } from "../../../shared/utils/is-uuid";
import { assertValidCreatePedidoDto } from "../dtos/create-pedido.dto";
import { parseListPedidosFilters } from "../dtos/list-pedidos.dto";
import { assertValidUpdatePedidoStatusDto } from "../dtos/update-pedido-status.dto";
import { toPedidoCreatedResponse, toPedidoListItemResponse, toUpdatePedidoStatusResponse } from "../mappers/pedido.mapper";
import { PedidoService } from "../services/pedido.service";

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const usuarioId = getUserId(req);
    const { comandaId } = req.params;

    if (!isUuid(comandaId)) {
      throw new AppError("ID de comanda inválido.", 400);
    }

    const dto = assertValidCreatePedidoDto(req.body);
    const pedido = await PedidoService.create(tenantId, usuarioId, comandaId, dto);

    res.status(201).json(toPedidoCreatedResponse(pedido));
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const filters = parseListPedidosFilters(req.query as Record<string, unknown>);
    const pedidos = await PedidoService.list(tenantId, filters);

    res.status(200).json(pedidos.map(toPedidoListItemResponse));
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    if (!isUuid(id)) {
      throw new AppError("ID de pedido inválido.", 400);
    }

    const dto = assertValidUpdatePedidoStatusDto(req.body);
    const pedido = await PedidoService.updateStatus(tenantId, id, dto.statusPreparo);

    res.status(200).json(toUpdatePedidoStatusResponse(pedido));
  } catch (error) {
    next(error);
  }
}
