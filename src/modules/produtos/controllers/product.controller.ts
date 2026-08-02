import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error";
import { getTenantId } from "../../../shared/utils/get-tenant-id";
import { isUuid } from "../../../shared/utils/is-uuid";
import { assertValidCreateProductDto } from "../dtos/create-product.dto";
import { parseListProductsFilters } from "../dtos/list-products.dto";
import { assertValidUpdateAvailabilityDto } from "../dtos/update-product-availability.dto";
import { toProductResponse } from "../mappers/product.mapper";
import { ProductService } from "../services/product.service";

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const dto = assertValidCreateProductDto(req.body);
    const product = await ProductService.create(tenantId, dto);

    res.status(201).json(toProductResponse(product));
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const filters = parseListProductsFilters(req.query as Record<string, unknown>);
    const products = await ProductService.list(tenantId, filters);

    res.status(200).json(products.map(toProductResponse));
  } catch (error) {
    next(error);
  }
}

export async function updateDisponibilidade(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    if (!isUuid(id)) {
      throw new AppError("ID de produto inválido.", 400);
    }

    const dto = assertValidUpdateAvailabilityDto(req.body);
    const product = await ProductService.updateDisponibilidade(tenantId, id, dto.disponivel);

    res.status(200).json(toProductResponse(product));
  } catch (error) {
    next(error);
  }
}
