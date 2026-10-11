import { AppError } from "../../../shared/errors/app-error";
import { validarTextoOpcional } from "../../clientes/dtos/cliente-input.validator";
import { StatusEntrega } from "../entities/entrega.entity";

const STATUS_VALIDOS = Object.values(StatusEntrega);

export interface TransicaoEntregaDto {
  status: StatusEntrega;
  // A versão que o operador estava vendo no painel (optimistic locking).
  versao: number;
  motivo: string | null;
}

export function assertValidTransicaoEntregaDto(body: unknown): TransicaoEntregaDto {
  const { status, versao, motivo } = (body ?? {}) as Record<string, unknown>;

  if (typeof status !== "string" || !STATUS_VALIDOS.includes(status as StatusEntrega)) {
    throw new AppError(`status deve ser um dos seguintes: ${STATUS_VALIDOS.join(", ")}.`, 400);
  }

  if (typeof versao !== "number" || !Number.isInteger(versao) || versao < 1) {
    throw new AppError("versao é obrigatória: envie a versão da entrega que está na tela.", 400);
  }

  return {
    status: status as StatusEntrega,
    versao,
    motivo: validarTextoOpcional(motivo, "motivo", 255),
  };
}
