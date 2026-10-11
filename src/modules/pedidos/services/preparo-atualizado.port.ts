import { EntityManager } from "typeorm";
import { TipoAtendimento } from "../../comandas/entities/comanda.entity";

// Porta "o preparo de uma comanda mudou" (PED-98). O módulo de pedidos avisa por aqui, sem
// conhecer quem escuta; o delivery registra o seu handler na composição do app (server.ts)
// para sincronizar a expedição. Inversão de dependência: pedidos não importa delivery.

export interface PreparoAtualizado {
  tenantId: string;
  comandaId: string;
  // Já vem do join carregado: handlers que só tratam delivery saem sem consultar o banco.
  tipoAtendimento: TipoAtendimento;
}

// Efeito que só pode acontecer depois do commit (ex.: imprimir um cupom).
export type AcaoPosCommit = () => Promise<void>;

// Roda dentro da transação de quem mudou o preparo, com o mesmo `manager`: se o handler
// falhar, a mudança do item também é desfeita. Não deve ter efeitos externos; devolve-os
// como ações para depois do commit.
export type PreparoAtualizadoHandler = (manager: EntityManager, evento: PreparoAtualizado) => Promise<AcaoPosCommit[]>;

const handlers: PreparoAtualizadoHandler[] = [];

export function registrarPreparoAtualizadoHandler(handler: PreparoAtualizadoHandler): void {
  if (!handlers.includes(handler)) {
    handlers.push(handler);
  }
}

export async function notificarPreparoAtualizado(manager: EntityManager, evento: PreparoAtualizado): Promise<AcaoPosCommit[]> {
  const acoes: AcaoPosCommit[] = [];

  for (const handler of handlers) {
    acoes.push(...(await handler(manager, evento)));
  }

  return acoes;
}

// Depois do commit a mudança já valeu: uma falha aqui (ex.: impressora fora) é registrada
// no log, mas não transforma a resposta em erro.
export async function executarAcoesPosCommit(acoes: AcaoPosCommit[]): Promise<void> {
  for (const acao of acoes) {
    try {
      await acao();
    } catch (error) {
      console.error("[PREPARO] Falha em ação pós-commit:", error);
    }
  }
}
