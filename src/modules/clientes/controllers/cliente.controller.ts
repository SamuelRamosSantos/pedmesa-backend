import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error";
import { getTenantId } from "../../../shared/utils/get-tenant-id";
import { isUuid } from "../../../shared/utils/is-uuid";
import { assertValidBuscarClienteQuery } from "../dtos/buscar-cliente.dto";
import { assertValidCreateClienteDto } from "../dtos/create-cliente.dto";
import { assertValidCreateEnderecoClienteDto } from "../dtos/create-endereco-cliente.dto";
import { assertValidUpdateClienteDto } from "../dtos/update-cliente.dto";
import { assertValidUpdateEnderecoClienteDto } from "../dtos/update-endereco-cliente.dto";
import { toClienteResponse, toEnderecoClienteResponse } from "../mappers/cliente.mapper";
import { ClienteService } from "../services/cliente.service";
import { EnderecoClienteService } from "../services/endereco-cliente.service";

function exigirUuid(valor: string, descricao: string): string {
  if (!isUuid(valor)) {
    throw new AppError(`ID de ${descricao} inválido.`, 400);
  }

  return valor;
}

export async function buscarPorTelefone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { telefone } = assertValidBuscarClienteQuery(req.query);
    const encontrado = await ClienteService.buscarPorTelefone(tenantId, telefone);

    res.status(200).json(encontrado ? toClienteResponse(encontrado.cliente, encontrado.enderecos) : null);
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const dto = assertValidCreateClienteDto(req.body);
    const cliente = await ClienteService.criar(tenantId, dto);

    res.status(201).json(toClienteResponse(cliente, []));
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const clienteId = exigirUuid(req.params.id, "cliente");
    const dto = assertValidUpdateClienteDto(req.body);
    const { cliente, enderecos } = await ClienteService.atualizar(tenantId, clienteId, dto);

    res.status(200).json(toClienteResponse(cliente, enderecos));
  } catch (error) {
    next(error);
  }
}

export async function createEndereco(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const clienteId = exigirUuid(req.params.id, "cliente");
    const dto = assertValidCreateEnderecoClienteDto(req.body);
    const endereco = await EnderecoClienteService.criar(tenantId, clienteId, dto);

    res.status(201).json(toEnderecoClienteResponse(endereco));
  } catch (error) {
    next(error);
  }
}

export async function updateEndereco(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const clienteId = exigirUuid(req.params.id, "cliente");
    const enderecoId = exigirUuid(req.params.enderecoId, "endereço");
    const dto = assertValidUpdateEnderecoClienteDto(req.body);
    const endereco = await EnderecoClienteService.atualizar(tenantId, clienteId, enderecoId, dto);

    res.status(200).json(toEnderecoClienteResponse(endereco));
  } catch (error) {
    next(error);
  }
}

export async function removeEndereco(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const clienteId = exigirUuid(req.params.id, "cliente");
    const enderecoId = exigirUuid(req.params.enderecoId, "endereço");
    await EnderecoClienteService.remover(tenantId, clienteId, enderecoId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
