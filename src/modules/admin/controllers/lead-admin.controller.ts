import { NextFunction, Request, Response } from "express";
import { toLeadResponse } from "../../leads/mappers/lead.mapper";
import { LeadService } from "../../leads/services/lead.service";

export async function list(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const leads = await LeadService.listar();

    res.status(200).json(leads.map(toLeadResponse));
  } catch (error) {
    next(error);
  }
}
