import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error";
import { getTenantId } from "../../../shared/utils/get-tenant-id";
import { getUserId } from "../../../shared/utils/get-user-id";
import { isUuid } from "../../../shared/utils/is-uuid";
import { assertValidCreatePedidoDto } from "../dtos/create-pedido.dto";
import { toPedidoCreatedResponse } from "../mappers/pedido.mapper";
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
