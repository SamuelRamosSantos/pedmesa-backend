import { NextFunction, Request, Response } from "express";
import { assertValidCreateLeadDto } from "../dtos/create-lead.dto";
import { toLeadResponse } from "../mappers/lead.mapper";
import { LeadService } from "../services/lead.service";

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = assertValidCreateLeadDto(req.body);
    const lead = await LeadService.criar(dto);

    res.status(201).json(toLeadResponse(lead));
  } catch (error) {
    next(error);
  }
}
