import { AppError } from "../../../shared/errors/app-error";
import { StatusFilaImpressao } from "../entities/fila-impressao.entity";

const STATUS_VALIDOS: StatusFilaImpressao[] = [StatusFilaImpressao.ENVIADO, StatusFilaImpressao.FALHOU];

export interface UpdateStatusFilaDto {
  status: StatusFilaImpressao;
  erroMensagem: string | null;
}

export function assertValidUpdateStatusFilaDto(body: unknown): UpdateStatusFilaDto {
  const { status, erro_mensagem: erroMensagem } = (body ?? {}) as Record<string, unknown>;

  if (!STATUS_VALIDOS.includes(status as StatusFilaImpressao)) {
    throw new AppError(`status deve ser um dos seguintes: ${STATUS_VALIDOS.join(", ")}.`, 400);
  }

  if (erroMensagem !== undefined && erroMensagem !== null && typeof erroMensagem !== "string") {
    throw new AppError("erro_mensagem inválido.", 400);
  }

  return {
    status: status as StatusFilaImpressao,
    erroMensagem: typeof erroMensagem === "string" ? erroMensagem : null,
  };
}
