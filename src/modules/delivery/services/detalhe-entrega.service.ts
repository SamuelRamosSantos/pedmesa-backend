import { AppDataSource } from "../../../config/data-source";
import { AppError } from "../../../shared/errors/app-error";
import { ItemPedido } from "../../pedidos/entities/item-pedido.entity";
import { Entrega } from "../entities/entrega.entity";
import { HistoricoStatusEntrega } from "../entities/historico-status-entrega.entity";
import { DetalheEntrega, montarDetalheEntrega } from "./detalhe-entrega";

// GET /delivery/entregas/:id (PED-130). Tudo filtrado pelo tenant: entrega de outro
// estabelecimento responde 404.
export async function buscarDetalheEntrega(
  tenantId: string,
  entregaId: string,
): Promise<DetalheEntrega> {
  const manager = AppDataSource.manager;
  const entrega = await manager.findOne(Entrega, {
    where: { id: entregaId, tenantId },
    relations: { cliente: true, comanda: true },
  });

  if (!entrega) {
    throw new AppError("Entrega não encontrada.", 404);
  }

  const itens = await manager
    .createQueryBuilder(ItemPedido, "item")
    .innerJoin("item.pedido", "pedido")
    .innerJoin("pedido.comanda", "comanda")
    .innerJoin("item.produto", "produto")
    .select("item.id", "id")
    .addSelect("produto.nome", "produto")
    .addSelect("item.quantidade", "quantidade")
    .addSelect("item.precoUnitario", "precoUnitario")
    .addSelect("item.observacao", "observacao")
    .addSelect("item.statusItem", "statusItem")
    .addSelect("produto.precisaPreparo", "precisaPreparo")
    .where("comanda.id = :comandaId", { comandaId: entrega.comandaId })
    .andWhere("comanda.tenantId = :tenantId", { tenantId })
    // Mesma ordem do card: pedidos por criação e, dentro de cada um, por nome.
    .orderBy("pedido.criadoEm", "ASC")
    .addOrderBy("produto.nome", "ASC")
    .addOrderBy("item.id", "ASC")
    .getRawMany<{
      id: string;
      produto: string;
      quantidade: number;
      precoUnitario: string;
      observacao: string | null;
      statusItem: ItemPedido["statusItem"];
      precisaPreparo: boolean;
    }>();

  const historico = await manager.find(HistoricoStatusEntrega, {
    where: { entregaId: entrega.id, tenantId },
    relations: { usuario: true },
    order: { criadoEm: "ASC" },
  });

  return montarDetalheEntrega({
    entrega,
    cliente: { nome: entrega.cliente.nome, telefone: entrega.cliente.telefone },
    desconto: {
      tipo: entrega.comanda.descontoTipo,
      valor: entrega.comanda.descontoValor,
    },
    itens: itens.map((item) => ({
      ...item,
      quantidade: Number(item.quantidade),
      precoUnitario: Number(item.precoUnitario),
    })),
    historico: historico.map((registro) => ({
      statusAnterior: registro.statusAnterior,
      statusNovo: registro.statusNovo,
      motivo: registro.motivo,
      usuarioNome: registro.usuario?.nome ?? null,
      criadoEm: registro.criadoEm,
    })),
  });
}
