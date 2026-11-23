import { validarBooleano } from "../../clientes/dtos/endereco-input.validator";
import { assertValidDescontoInput } from "../../comandas/dtos/desconto-input.validator";
import { DescontoTipo } from "../../comandas/entities/comanda.entity";
import { DescontoInput } from "../../comandas/services/desconto-calculator";

// Ajustes de valor do pedido delivery (PED-126): desconto nos itens (mesmas regras do
// caixa) e isenção da taxa de entrega. Só a intenção: quanto vale o desconto e a taxa é
// calculado no servidor.
export interface AjustesPedidoDelivery {
  desconto: DescontoInput;
  isentarTaxa: boolean;
}

export const SEM_AJUSTES: AjustesPedidoDelivery = {
  desconto: { tipo: DescontoTipo.NENHUM, valor: 0 },
  isentarTaxa: false,
};

export function validarAjustesPedidoDelivery(
  body: Record<string, unknown>,
): AjustesPedidoDelivery {
  const { descontoTipo, descontoValor } = assertValidDescontoInput(body);
  const isentar = body.isentar_taxa_entrega;

  return {
    desconto: { tipo: descontoTipo, valor: descontoValor },
    isentarTaxa:
      isentar === undefined || isentar === null
        ? false
        : validarBooleano(isentar, "isentar_taxa_entrega"),
  };
}

// Desconto ou isenção dependem da permissão de conceder desconto (a mesma do caixa).
export function temAjusteDeValor(ajustes: AjustesPedidoDelivery): boolean {
  return ajustes.isentarTaxa || ajustes.desconto.tipo !== DescontoTipo.NENHUM;
}
