import { EntityManager } from "typeorm";
import { AppError } from "../../../shared/errors/app-error";
import { Comanda, ComandaStatus } from "../entities/comanda.entity";
import { carregarExtrato } from "./extrato-loader";
import { podeCancelarComandaZerada } from "./fechamento-calculator";

// Encerra uma comanda sem valor a cobrar, dentro da transação do chamador. Usada pelo
// "cancelar comanda zerada" do caixa e pelo cancelamento da entrega (PED-100), que antes
// cancela todos os itens na mesma transação.
//
// Trava a linha da comanda antes de ler: concorre em fila com um fechamento simultâneo.
export async function cancelarComandaZeradaNaTransacao(manager: EntityManager, tenantId: string, comandaId: string): Promise<Comanda> {
  await manager
    .createQueryBuilder(Comanda, "comanda")
    .setLock("pessimistic_write")
    .where("comanda.id = :comandaId", { comandaId })
    .andWhere("comanda.tenantId = :tenantId", { tenantId })
    .getOne();

  const { comanda, calculado } = await carregarExtrato(manager, tenantId, comandaId);

  if (comanda.status !== ComandaStatus.ABERTA) {
    throw new AppError("Esta comanda já está fechada.", 400);
  }

  if (!podeCancelarComandaZerada(calculado.resumo_financeiro.valor_total_comanda)) {
    throw new AppError(
      "Esta comanda possui itens com valor pendente e não pode ser cancelada diretamente. Utilize o fechamento com pagamento.",
      400
    );
  }

  await manager.update(Comanda, { id: comanda.id, tenantId }, { status: ComandaStatus.FECHADA, fechadaEm: new Date() });

  return manager.findOneByOrFail(Comanda, { id: comanda.id, tenantId });
}
