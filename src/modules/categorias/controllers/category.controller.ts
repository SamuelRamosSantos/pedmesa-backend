import { NextFunction, Request, Response } from "express";
import { getTenantId } from "../../../shared/utils/get-tenant-id";
import { assertValidCreateCategoryDto } from "../dtos/create-category.dto";
import { toCategoryResponse } from "../mappers/category.mapper";
import { CategoryService } from "../services/category.service";

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const dto = assertValidCreateCategoryDto(req.body);
    const category = await CategoryService.create(tenantId, dto);

    res.status(201).json(toCategoryResponse(category));
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const categories = await CategoryService.listActive(tenantId);

    res.status(200).json(categories.map(toCategoryResponse));
  } catch (error) {
    next(error);
  }
}
