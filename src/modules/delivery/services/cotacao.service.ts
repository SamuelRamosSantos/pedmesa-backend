import { EntityManager, In } from "typeorm";
import { AppError } from "../../../shared/errors/app-error";
import { toCents } from "../../../shared/utils/money";
import { resolverProdutosDosItens } from "../../pedidos/services/produtos-dos-itens";
import { Product } from "../../produtos/entities/product.entity";
import { Tenant } from "../../tenants/entities/tenant.entity";
import { CotacaoDeliveryDto } from "../dtos/cotacao-delivery.dto";
import { CotacaoPedido, montarCotacaoPedido, somarSubtotalCents } from "./cotacao-pedido";
import { CalculadoraFrete, criarCalculadoraFrete } from "./frete";

// Cota um pedido delivery com os preços do banco e o frete da estratégia configurada.
// Recebe o EntityManager para a criação do pedido (PED-96) cotar dentro da sua transação;
// a calculadora pode ser injetada (testes ou outra estratégia), senão vem do ponto de
// composição.
export async function cotarPedidoDelivery(
  manager: EntityManager,
  tenantId: string,
  dto: CotacaoDeliveryDto,
  calculadora: CalculadoraFrete = criarCalculadoraFrete(manager)
): Promise<CotacaoPedido> {
  const tenant = await manager.findOne(Tenant, {
    select: { id: true, deliveryAtivo: true, pedidoMinimoDelivery: true },
    where: { id: tenantId },
  });

  if (!tenant) {
    throw new AppError("Tenant não encontrado.", 404);
  }

  if (!tenant.deliveryAtivo) {
    throw new AppError("O delivery está desativado neste estabelecimento.", 400);
  }

  const produtoIds = [...new Set(dto.itens.map((item) => item.produtoId))];
  // Cotação só do frete (sem itens, PED-108): nada a buscar.
  const produtos = produtoIds.length === 0 ? [] : await manager.findBy(Product, { id: In(produtoIds), tenantId });
  const produtosDosItens = resolverProdutosDosItens(dto.itens, new Map(produtos.map((produto) => [produto.id, produto])));

  const subtotalCents = somarSubtotalCents(
    dto.itens.map((item, index) => ({ quantidade: item.quantidade, precoUnitario: produtosDosItens[index].preco }))
  );

  return montarCotacaoPedido({
    subtotalCents,
    frete: await calculadora.cotar(tenantId, dto.endereco),
    pedidoMinimoCents: toCents(tenant.pedidoMinimoDelivery),
    formaPagamento: dto.formaPagamento,
    trocoParaCents: dto.trocoParaCents,
  });
}
