import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";

export function requirePodeExcluirItemFechamento(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user?.podeExcluirItemFechamento) {
    next(new AppError("Você não tem permissão para excluir itens no fechamento.", 403));
    return;
  }

  next();
}
