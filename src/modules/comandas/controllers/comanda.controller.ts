import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error";
import { getTenantId } from "../../../shared/utils/get-tenant-id";
import { isUuid } from "../../../shared/utils/is-uuid";
import { assertValidAddIntegranteDto } from "../dtos/add-integrante.dto";
import { assertValidCreateComandaDto } from "../dtos/create-comanda.dto";
import { assertValidFecharComandaDto } from "../dtos/fechar-comanda.dto";
import { assertValidJoinComandasDto } from "../dtos/join-comandas.dto";
import { parseListComandasFilters } from "../dtos/list-comandas.dto";
import {
  toComandaDetailResponse,
  toComandaListItemResponse,
  toFecharComandaResponse,
  toJuntarComandasResponse,
} from "../mappers/comanda.mapper";
import { toExtratoResponse } from "../mappers/extrato.mapper";
import { toIntegranteResponse } from "../mappers/integrante.mapper";
import { ComandaService } from "../services/comanda.service";

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const dto = assertValidCreateComandaDto(req.body);
    const comanda = await ComandaService.create(tenantId, dto);

    res.status(201).json(toComandaDetailResponse(comanda));
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const filters = parseListComandasFilters(req.query as Record<string, unknown>);
    const comandas = await ComandaService.list(tenantId, filters);

    res.status(200).json(comandas.map(toComandaListItemResponse));
  } catch (error) {
    next(error);
  }
}

export async function addIntegrante(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    if (!isUuid(id)) {
      throw new AppError("ID de comanda inválido.", 400);
    }

    const dto = assertValidAddIntegranteDto(req.body);
    const integrante = await ComandaService.addIntegrante(tenantId, id, dto.nome);

    res.status(201).json(toIntegranteResponse(integrante));
  } catch (error) {
    next(error);
  }
}

export async function getExtrato(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    if (!isUuid(id)) {
      throw new AppError("ID de comanda inválido.", 400);
    }

    const { comanda, calculado } = await ComandaService.getExtrato(tenantId, id);

    res.status(200).json(toExtratoResponse(comanda, calculado));
  } catch (error) {
    next(error);
  }
}

export async function juntar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const dto = assertValidJoinComandasDto(req.body);
    const comandaPrincipal = await ComandaService.juntar(tenantId, dto);

    res.status(200).json(toJuntarComandasResponse(comandaPrincipal));
  } catch (error) {
    next(error);
  }
}

export async function fechar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    if (!isUuid(id)) {
      throw new AppError("ID de comanda inválido.", 400);
    }

    const dto = assertValidFecharComandaDto(req.body);
    const comanda = await ComandaService.fechar(tenantId, id, dto);

    res.status(200).json(toFecharComandaResponse(comanda));
  } catch (error) {
    next(error);
  }
}
