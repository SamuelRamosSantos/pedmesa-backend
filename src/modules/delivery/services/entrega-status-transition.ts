import { AppError } from "../../../shared/errors/app-error";
import { StatusPreparo } from "../../pedidos/entities/pedido.entity";
import { StatusEntrega } from "../entities/entrega.entity";

// Única fonte das transições de status da entrega (ADR-001, decisão 3 do PO: em rota
// não cancela direto; primeiro registra o retorno com motivo, depois cancela).
export const TRANSICOES_VALIDAS: Readonly<Record<StatusEntrega, readonly StatusEntrega[]>> = {
  [StatusEntrega.EM_PRODUCAO]: [StatusEntrega.PRONTO_PARA_ENVIO, StatusEntrega.CANCELADO],
  [StatusEntrega.PRONTO_PARA_ENVIO]: [StatusEntrega.EM_ROTA, StatusEntrega.EM_PRODUCAO, StatusEntrega.CANCELADO],
  [StatusEntrega.EM_ROTA]: [StatusEntrega.ENTREGUE, StatusEntrega.PRONTO_PARA_ENVIO],
  [StatusEntrega.ENTREGUE]: [],
  [StatusEntrega.CANCELADO]: [],
};

export const MOTIVO_MINIMO_CARACTERES = 5;

const PREPARO_CONCLUIDO: readonly StatusPreparo[] = [StatusPreparo.PRONTO, StatusPreparo.ENTREGUE];

// Dados que as guardas precisam, já carregados pelo service (as guardas não acessam o banco).
export interface ContextoTransicaoEntrega {
  statusPreparoDosPedidos: StatusPreparo[];
  motivo: string | null;
}

// Cancelar e devolver uma entrega que estava em rota exigem uma justificativa.
export function transicaoExigeMotivo(statusAtual: StatusEntrega, statusNovo: StatusEntrega): boolean {
  return (
    statusNovo === StatusEntrega.CANCELADO ||
    (statusAtual === StatusEntrega.EM_ROTA && statusNovo === StatusEntrega.PRONTO_PARA_ENVIO)
  );
}

function assertPreparoConcluido(statusPreparoDosPedidos: StatusPreparo[]): void {
  if (statusPreparoDosPedidos.length === 0) {
    throw new AppError("A entrega não tem pedidos para enviar.", 400);
  }

  if (!statusPreparoDosPedidos.every((status) => PREPARO_CONCLUIDO.includes(status))) {
    throw new AppError("A entrega só pode ficar pronta para envio quando todos os pedidos estiverem prontos.", 400);
  }
}

function assertMotivoInformado(motivo: string | null): void {
  if ((motivo?.trim().length ?? 0) < MOTIVO_MINIMO_CARACTERES) {
    throw new AppError(`Informe o motivo com pelo menos ${MOTIVO_MINIMO_CARACTERES} caracteres.`, 400);
  }
}

export function assertTransicaoEntregaValida(
  statusAtual: StatusEntrega,
  statusNovo: StatusEntrega,
  contexto: ContextoTransicaoEntrega
): void {
  if (statusAtual === statusNovo) {
    throw new AppError(`A entrega já está com o status "${statusNovo}".`, 400);
  }

  if (!TRANSICOES_VALIDAS[statusAtual].includes(statusNovo)) {
    throw new AppError(`Transição de status inválida: não é possível ir de "${statusAtual}" para "${statusNovo}".`, 400);
  }

  if (statusNovo === StatusEntrega.PRONTO_PARA_ENVIO) {
    assertPreparoConcluido(contexto.statusPreparoDosPedidos);
  }

  if (transicaoExigeMotivo(statusAtual, statusNovo)) {
    assertMotivoInformado(contexto.motivo);
  }
}
