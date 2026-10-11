import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error";
import { getTenantId } from "../../../shared/utils/get-tenant-id";
import { getUserId } from "../../../shared/utils/get-user-id";
import { isUuid } from "../../../shared/utils/is-uuid";
import { assertValidCriarPedidoDeliveryDto } from "../dtos/criar-pedido-delivery.dto";
import { assertValidTransicaoEntregaDto } from "../dtos/transicao-entrega.dto";
import { toEntregaEstadoResponse } from "../mappers/entrega.mapper";
import { toPedidoDeliveryCriadoResponse } from "../mappers/pedido-delivery.mapper";
import { criarPedidoDelivery } from "../services/pedido-delivery.service";
import { enfileirarTicketEntrega } from "../services/ticket-entrega.service";
import { transicionarEntrega } from "../services/transicao-entrega.service";

export async function criar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = assertValidCriarPedidoDeliveryDto(req.body);
    const criado = await criarPedidoDelivery(getTenantId(req), getUserId(req), dto);

    res.status(201).json(toPedidoDeliveryCriadoResponse(criado));
  } catch (error) {
    next(error);
  }
}

export async function transicionarStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!isUuid(req.params.id)) {
      throw new AppError("ID de entrega inválido.", 400);
    }

    const dto = assertValidTransicaoEntregaDto(req.body);
    const entrega = await transicionarEntrega(getTenantId(req), req.params.id, getUserId(req), dto);

    res.status(200).json(toEntregaEstadoResponse(entrega));
  } catch (error) {
    next(error);
  }
}

export async function reimprimirTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!isUuid(req.params.id)) {
      throw new AppError("ID de entrega inválido.", 400);
    }

    await enfileirarTicketEntrega(getTenantId(req), req.params.id);

    res.status(202).json({ mensagem: "Cupom de entrega enviado para impressão." });
  } catch (error) {
    next(error);
  }
}
