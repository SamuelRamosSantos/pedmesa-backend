import { StatusPreparo } from "../../pedidos/entities/pedido.entity";
import { StatusEntrega } from "../entities/entrega.entity";
import { preparoConcluido } from "./entrega-status-transition";

// Decide se a cozinha muda a coluna da entrega na expedição (PED-98). Devolve o novo
// status, ou null quando nada muda:
// - em produção + todo o preparo concluído → pronto para envio;
// - pronto para envio + a cozinha regrediu algum item → volta para em produção;
// - em rota, entregue ou cancelado: a cozinha não mexe mais.
// Sem nenhum item ativo (tudo cancelado) não avança: não há o que enviar.
export function decidirStatusPorPreparo(
  statusAtual: StatusEntrega,
  statusPreparoDosPedidos: readonly StatusPreparo[],
  possuiItensAtivos: boolean
): StatusEntrega | null {
  const concluido = possuiItensAtivos && preparoConcluido(statusPreparoDosPedidos);

  if (statusAtual === StatusEntrega.EM_PRODUCAO && concluido) {
    return StatusEntrega.PRONTO_PARA_ENVIO;
  }

  if (statusAtual === StatusEntrega.PRONTO_PARA_ENVIO && !concluido) {
    return StatusEntrega.EM_PRODUCAO;
  }

  return null;
}
