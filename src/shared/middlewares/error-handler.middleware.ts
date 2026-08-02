import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";

export function errorHandlerMiddleware(error: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  console.error(error);
  res.status(500).json({ message: "Erro interno do servidor." });
}
