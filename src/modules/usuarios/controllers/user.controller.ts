import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error";
import { getTenantId } from "../../../shared/utils/get-tenant-id";
import { getUserId } from "../../../shared/utils/get-user-id";
import { isUuid } from "../../../shared/utils/is-uuid";
import { assertValidChangePasswordDto } from "../dtos/change-password.dto";
import { assertValidCreateUserDto } from "../dtos/create-user.dto";
import { assertValidUpdateAtivoDto } from "../dtos/update-ativo.dto";
import { assertValidUpdateUserDto } from "../dtos/update-user.dto";
import { toUserResponse } from "../mappers/user.mapper";
import { UserService } from "../services/user.service";

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const dto = assertValidCreateUserDto(req.body);
    const user = await UserService.create(tenantId, dto);

    res.status(201).json(toUserResponse(user));
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const users = await UserService.list(tenantId);

    res.status(200).json(users.map(toUserResponse));
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const actingUserId = getUserId(req);
    const { id } = req.params;

    if (!isUuid(id)) {
      throw new AppError("ID de usuário inválido.", 400);
    }

    const dto = assertValidUpdateUserDto(req.body);
    const user = await UserService.update(tenantId, id, actingUserId, dto);

    res.status(200).json(toUserResponse(user));
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    if (!isUuid(id)) {
      throw new AppError("ID de usuário inválido.", 400);
    }

    const dto = assertValidChangePasswordDto(req.body);
    await UserService.changePassword(tenantId, id, dto.novaSenha);

    res.status(200).json({ mensagem: "Senha atualizada com sucesso." });
  } catch (error) {
    next(error);
  }
}

export async function updateAtivo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const actingUserId = getUserId(req);
    const { id } = req.params;

    if (!isUuid(id)) {
      throw new AppError("ID de usuário inválido.", 400);
    }

    const dto = assertValidUpdateAtivoDto(req.body);
    const user = await UserService.updateAtivo(tenantId, id, actingUserId, dto.ativo);

    res.status(200).json(toUserResponse(user));
  } catch (error) {
    next(error);
  }
}
