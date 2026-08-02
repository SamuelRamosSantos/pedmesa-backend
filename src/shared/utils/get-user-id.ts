import { Request } from "express";
import { AppError } from "../errors/app-error";

export function getUserId(req: Request): string {
  if (!req.user) {
    throw new AppError("Usuário não identificado na requisição.", 401);
  }

  return req.user.id;
}
