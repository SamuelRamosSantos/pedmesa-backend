import { NextFunction, Request, Response } from "express";
import { assertValidLoginDto } from "../dtos/login.dto";
import { AuthService } from "../services/auth.service";

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = assertValidLoginDto(req.body);
    const result = await AuthService.login(dto);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
