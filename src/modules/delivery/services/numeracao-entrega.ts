import { EntityManager } from "typeorm";

// Próximo numero_entrega do tenant no dia. Um único comando atômico:
// - primeira entrega do dia: INSERT com 1;
// - demais: o ON CONFLICT incrementa a linha existente e devolve o novo valor.
// A linha fica travada até o fim da transação do chamador, então criações
// simultâneas no mesmo tenant e dia recebem números distintos, sem MAX()+1.
//
// Deve ser chamado com o EntityManager da mesma transação que grava a entrega:
// se a gravação falhar, o incremento também é desfeito e o número não "pula".
export async function proximoNumeroEntrega(manager: EntityManager, tenantId: string, data: string): Promise<number> {
  const linhas: Array<{ ultimo_numero: number }> = await manager.query(
    `INSERT INTO "sequencias_entrega" ("tenant_id", "data", "ultimo_numero")
     VALUES ($1, $2, 1)
     ON CONFLICT ("tenant_id", "data")
     DO UPDATE SET "ultimo_numero" = "sequencias_entrega"."ultimo_numero" + 1
     RETURNING "ultimo_numero"`,
    [tenantId, data]
  );

  return linhas[0].ultimo_numero;
}
