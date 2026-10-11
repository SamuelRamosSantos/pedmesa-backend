import { EntityManager } from "typeorm";
import { AppError } from "../../../shared/errors/app-error";
import { Entrega } from "../../delivery/entities/entrega.entity";
import { ItemPedido } from "../../pedidos/entities/item-pedido.entity";
import { Comanda, TipoAtendimento } from "../entities/comanda.entity";
import { PagamentoComanda } from "../entities/pagamento-comanda.entity";
import { calcularExtrato, ExtratoCalculado } from "./extrato-calculator";

export interface ExtratoCarregado {
  comanda: Comanda;
  calculado: ExtratoCalculado;
  pagamentos: PagamentoComanda[];
}

// Taxa de entrega da comanda: 0 para mesa; para delivery, o snapshot gravado na entrega.
async function buscarTaxaEntrega(manager: EntityManager, comanda: Comanda): Promise<number> {
  if (comanda.tipoAtendimento !== TipoAtendimento.DELIVERY) {
    return 0;
  }

  const entrega = await manager.findOne(Entrega, {
    select: { id: true, taxaEntrega: true },
    where: { comandaId: comanda.id, tenantId: comanda.tenantId },
  });

  if (!entrega) {
    // Comanda delivery e entrega são criadas na mesma transação (PED-96): sem entrega, o
    // estado está inconsistente. Falhar alto é melhor que cobrar sem a taxa.
    throw new Error(`Comanda delivery ${comanda.id} sem registro em entregas.`);
  }

  return entrega.taxaEntrega;
}

// Carrega comanda, itens e pagamentos e calcula o extrato, tudo pelo `manager` recebido
// (PED-95). Dentro de uma transação, enxerga o que a própria transação já gravou, como um
// pagamento registrado na mesma operação que fecha a comanda.
export async function carregarExtrato(
  manager: EntityManager,
  tenantId: string,
  comandaId: string
): Promise<ExtratoCarregado> {
  const comanda = await manager.findOne(Comanda, {
    where: { id: comandaId, tenantId },
    relations: { integrantes: true },
  });

  if (!comanda) {
    throw new AppError("Comanda não encontrada.", 404);
  }

  const itens = await manager
    .createQueryBuilder(ItemPedido, "item")
    .innerJoin("item.pedido", "pedido")
    .leftJoinAndSelect("item.produto", "produto")
    .where("pedido.comandaId = :comandaId", { comandaId: comanda.id })
    .getMany();

  const calculado = calcularExtrato({
    itens: itens.map((item) => ({
      id: item.id,
      produtoNome: item.produto.nome,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario,
      integranteId: item.integranteId,
      statusItem: item.statusItem,
    })),
    integrantes: comanda.integrantes.map((integrante) => ({ id: integrante.id, nome: integrante.nome })),
    taxaEntrega: await buscarTaxaEntrega(manager, comanda),
  });

  const pagamentos = await manager.find(PagamentoComanda, {
    where: { comandaId: comanda.id },
    order: { criadoEm: "ASC" },
  });

  return { comanda, calculado, pagamentos };
}
