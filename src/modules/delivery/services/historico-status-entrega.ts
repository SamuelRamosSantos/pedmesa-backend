import { EntityManager } from "typeorm";
import { StatusEntrega } from "../entities/entrega.entity";
import { HistoricoStatusEntrega } from "../entities/historico-status-entrega.entity";

export interface RegistroHistoricoStatusEntrega {
  tenantId: string;
  entregaId: string;
  statusAnterior: StatusEntrega | null;
  statusNovo: StatusEntrega;
  // null quando a transição é automática (sem usuário que a disparou).
  usuarioId: string | null;
  motivo: string | null;
}

// Único ponto de gravação do histórico. Recebe o EntityManager da transação que muda o
// status, para que a mudança e o registro sejam gravados (ou desfeitos) juntos.
export async function registrarHistoricoStatusEntrega(
  manager: EntityManager,
  registro: RegistroHistoricoStatusEntrega
): Promise<HistoricoStatusEntrega> {
  return manager.save(manager.create(HistoricoStatusEntrega, registro));
}
