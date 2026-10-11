import { EntityManager, In } from "typeorm";
import { AppError } from "../../../shared/errors/app-error";
import { Comanda, ComandaStatus } from "../../comandas/entities/comanda.entity";
import { IntegranteComanda } from "../../comandas/entities/integrante-comanda.entity";
import { PrintJobItemPayload } from "../../impressao/types/print-job.types";
import { Product } from "../../produtos/entities/product.entity";
import { Tenant } from "../../tenants/entities/tenant.entity";
import { CreatePedidoDto } from "../dtos/create-pedido.dto";
import { ItemPedido } from "../entities/item-pedido.entity";
import { Pedido, StatusPreparo } from "../entities/pedido.entity";
import { resolveStatusItemInicial } from "./item-status-inicial";
import { resolverProdutosDosItens } from "./produtos-dos-itens";
import { calcularStatusPreparoPedido } from "./status-preparo-calculator";

export interface LancamentoItensResultado {
  pedido: Pedido;
  // Itens já no formato do ticket da cozinha. O chamador enfileira a impressão DEPOIS do
  // commit da transação, para nunca imprimir um pedido que acabou desfeito.
  itensImpressao: PrintJobItemPayload[];
}

// Lança um pedido com seus itens numa comanda aberta, dentro da transação do chamador
// (PED-95). Usada pelo lançamento da mesa (PedidoService.create) e pela criação do
// pedido delivery (PED-96), que compõe esta etapa com outras na mesma transação.
//
// Tudo é lido e gravado pelo `manager` recebido: se qualquer etapa do chamador falhar
// depois, o pedido e os itens também são desfeitos.
export async function lancarItensNaComanda(
  manager: EntityManager,
  tenant: Tenant,
  comanda: Comanda,
  usuarioId: string,
  dto: CreatePedidoDto
): Promise<LancamentoItensResultado> {
  if (comanda.status !== ComandaStatus.ABERTA) {
    throw new AppError("Não é possível lançar itens em uma comanda fechada.", 400);
  }

  const produtoIds = [...new Set(dto.itens.map((item) => item.produtoId))];
  const produtos = await manager.findBy(Product, { id: In(produtoIds), tenantId: tenant.id });
  const produtosPorId = new Map(produtos.map((produto) => [produto.id, produto]));

  const integranteIds = [...new Set(dto.itens.map((item) => item.integranteId).filter((id): id is string => id !== null))];
  const integrantesPorId = new Map<string, IntegranteComanda>();

  if (integranteIds.length > 0) {
    const integrantes = await manager.findBy(IntegranteComanda, { id: In(integranteIds), comandaId: comanda.id });
    integrantes.forEach((integrante) => integrantesPorId.set(integrante.id, integrante));
  }

  const produtosDosItens = resolverProdutosDosItens(dto.itens, produtosPorId);

  const itensValidados = dto.itens.map((item, index) => {
    const produto = produtosDosItens[index];

    if (item.integranteId !== null && !integrantesPorId.has(item.integranteId)) {
      throw new AppError(`O integrante informado no item ${index} não pertence a esta comanda.`, 400);
    }

    const integrante = item.integranteId ? integrantesPorId.get(item.integranteId) ?? null : null;

    return { item, produto, integrante };
  });

  const pedido = await manager.save(
    manager.create(Pedido, {
      comandaId: comanda.id,
      usuarioId,
      statusPreparo: StatusPreparo.PENDENTE,
    })
  );

  pedido.itens = await manager.save(
    itensValidados.map(({ item, produto }) =>
      manager.create(ItemPedido, {
        pedidoId: pedido.id,
        produtoId: item.produtoId,
        integranteId: item.integranteId,
        quantidade: item.quantidade,
        precoUnitario: produto.preco,
        observacao: item.observacao,
        statusItem: resolveStatusItemInicial(produto.precisaPreparo, tenant.usaModuloCozinha),
      })
    )
  );

  pedido.statusPreparo = calcularStatusPreparoPedido(pedido.itens.map((item) => item.statusItem));
  await manager.save(pedido);

  const itensImpressao = itensValidados.map(
    ({ item, produto, integrante }): PrintJobItemPayload => ({
      produto_nome: produto.nome,
      quantidade: item.quantidade,
      preco_unitario: produto.preco,
      subtotal: produto.preco * item.quantidade,
      integrante_nome: integrante?.nome ?? null,
      observacao: item.observacao,
    })
  );

  return { pedido, itensImpressao };
}
