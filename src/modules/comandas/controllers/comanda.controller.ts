import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error";
import { getTenantId } from "../../../shared/utils/get-tenant-id";
import { getUserId } from "../../../shared/utils/get-user-id";
import { isUuid } from "../../../shared/utils/is-uuid";
import { assertValidAddIntegranteDto } from "../dtos/add-integrante.dto";
import { assertValidAddPagamentoComandaDto } from "../dtos/add-pagamento-comanda.dto";
import { assertValidCreateComandaDto } from "../dtos/create-comanda.dto";
import { assertValidFecharComandaDto } from "../dtos/fechar-comanda.dto";
import { assertValidJoinComandasDto } from "../dtos/join-comandas.dto";
import { assertValidUpdateDescontoComandaDto } from "../dtos/update-desconto-comanda.dto";
import { parseListComandasFilters } from "../dtos/list-comandas.dto";
import {
  toCancelarComandaResponse,
  toComandaDetailResponse,
  toComandaListItemResponse,
  toDescontoComandaResponse,
  toFecharComandaResponse,
  toJuntarComandasResponse,
} from "../mappers/comanda.mapper";
import { toExtratoResponse } from "../mappers/extrato.mapper";
import { toIntegranteResponse } from "../mappers/integrante.mapper";
import { toPagamentoComandaResponse } from "../mappers/pagamento-comanda.mapper";
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

    const { comanda, calculado, pagamentos } = await ComandaService.getExtrato(tenantId, id);

    res.status(200).json(toExtratoResponse(comanda, calculado, pagamentos));
  } catch (error) {
    next(error);
  }
}

export async function addPagamento(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const usuarioId = getUserId(req);
    const { id } = req.params;

    if (!isUuid(id)) {
      throw new AppError("ID de comanda inválido.", 400);
    }

    const dto = assertValidAddPagamentoComandaDto(req.body);
    const pagamento = await ComandaService.addPagamento(tenantId, id, usuarioId, dto);

    res.status(201).json(toPagamentoComandaResponse(pagamento));
  } catch (error) {
    next(error);
  }
}

export async function removePagamento(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id, pagamentoId } = req.params;

    if (!isUuid(id) || !isUuid(pagamentoId)) {
      throw new AppError("ID inválido.", 400);
    }

    await ComandaService.removePagamento(tenantId, id, pagamentoId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function atualizarDesconto(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    if (!isUuid(id)) {
      throw new AppError("ID de comanda inválido.", 400);
    }

    const dto = assertValidUpdateDescontoComandaDto(req.body);
    const podeConcederDesconto = req.user?.podeConcederDesconto ?? false;
    const comanda = await ComandaService.atualizarDesconto(tenantId, id, dto, podeConcederDesconto);

    res.status(200).json(toDescontoComandaResponse(comanda));
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
    const podeConcederDesconto = req.user?.podeConcederDesconto ?? false;
    const resultado = await ComandaService.fechar(tenantId, id, dto, podeConcederDesconto);

    res.status(200).json(toFecharComandaResponse(resultado));
  } catch (error) {
    next(error);
  }
}

export async function imprimirPreConta(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    if (!isUuid(id)) {
      throw new AppError("ID de comanda inválido.", 400);
    }

    await ComandaService.imprimirPreConta(tenantId, id);

    res.status(200).json({ mensagem: "Pré-conta enviada para impressão." });
  } catch (error) {
    next(error);
  }
}

export async function cancelar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    if (!isUuid(id)) {
      throw new AppError("ID de comanda inválido.", 400);
    }

    const comanda = await ComandaService.cancelarZerada(tenantId, id);

    res.status(200).json(toCancelarComandaResponse(comanda));
  } catch (error) {
    next(error);
  }
}
