import { TipoAtendimento } from "../../comandas/entities/comanda.entity";

// Rótulo do atendimento no histórico do dashboard (PED-103): "Mesa 12" ou "Delivery #7".
// Sem o número (dado inconsistente), cai no rótulo genérico em vez de "Mesa null".
export function identificadorDoAtendimento(
  tipo: TipoAtendimento,
  numeroComanda: number | null,
  numeroEntrega: number | null
): string {
  if (tipo === TipoAtendimento.DELIVERY) {
    return numeroEntrega === null ? "Delivery" : `Delivery #${numeroEntrega}`;
  }

  return numeroComanda === null ? "Mesa" : `Mesa ${numeroComanda}`;
}
