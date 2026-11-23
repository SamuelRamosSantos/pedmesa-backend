import { fromCents, toCents } from "../../../shared/utils/money";
import { FormaPagamento } from "../../comandas/entities/pagamento-comanda.entity";
import { DescontoInput } from "../../comandas/services/desconto-calculator";
import { calcularTotalComEntrega } from "../../comandas/services/total-com-entrega-calculator";
import { StatusItem } from "../../pedidos/entities/item-pedido.entity";
import { StatusPreparo } from "../../pedidos/entities/pedido.entity";
import { Entrega, StatusEntrega } from "../entities/entrega.entity";
import { descontoParaExibicao, situacaoDaCozinha } from "./painel-entrega";
import { calcularTroco } from "./troco-calculator";

// Detalhe completo de uma entrega para o modal da expedição (PED-130). Os valores saem
// das mesmas funções do card, do cupom e do fechamento.

export interface ItemDetalheEntrada {
  id: string;
  produto: string;
  quantidade: number;
  precoUnitario: number;
  observacao: string | null;
  statusItem: StatusItem;
  precisaPreparo: boolean;
}

export interface HistoricoDetalheEntrada {
  statusAnterior: StatusEntrega | null;
  statusNovo: StatusEntrega;
  motivo: string | null;
  // null = transição automática (sincronização com a cozinha).
  usuarioNome: string | null;
  criadoEm: Date;
}

export type EntregaParaDetalhe = Pick<
  Entrega,
  | "id"
  | "numeroEntrega"
  | "statusEntrega"
  | "versao"
  | "enderecoCep"
  | "enderecoLogradouro"
  | "enderecoNumero"
  | "enderecoComplemento"
  | "enderecoBairro"
  | "enderecoCidade"
  | "enderecoUf"
  | "enderecoReferencia"
  | "taxaEntrega"
  | "taxaIsenta"
  | "formaPagamentoPrevista"
  | "trocoPara"
  | "criadoEm"
  | "previsaoEntregaEm"
  | "saiuEm"
  | "entregueEm"
  | "motivoCancelamento"
>;

export interface EntradaDetalheEntrega {
  entrega: EntregaParaDetalhe;
  cliente: { nome: string; telefone: string };
  desconto: DescontoInput;
  itens: ItemDetalheEntrada[];
  historico: HistoricoDetalheEntrada[];
}

export interface DetalheEntrega {
  entrega: EntregaParaDetalhe;
  cliente: { nome: string; telefone: string };
  itens: (ItemDetalheEntrada & { subtotal: number })[];
  valores: {
    subtotal: number;
    desconto: number;
    taxaEntrega: number;
    taxaIsenta: boolean;
    total: number;
  };
  pagamento: {
    forma: FormaPagamento;
    trocoPara: number | null;
    troco: number;
    trocoSuficiente: boolean;
  };
  statusPreparo: StatusPreparo;
  passaPelaCozinha: boolean;
  historico: HistoricoDetalheEntrada[];
}

export function montarDetalheEntrega({
  entrega,
  cliente,
  desconto,
  itens,
  historico,
}: EntradaDetalheEntrega): DetalheEntrega {
  const ativos = itens.filter(
    (item) => item.statusItem !== StatusItem.CANCELADO,
  );
  const subtotal = fromCents(
    ativos.reduce(
      (soma, item) => soma + toCents(item.precoUnitario) * item.quantidade,
      0,
    ),
  );
  const totais = calcularTotalComEntrega(
    subtotal,
    descontoParaExibicao(desconto.tipo, desconto.valor, subtotal),
    entrega.taxaEntrega,
  );
  const troco = calcularTroco({
    totalCents: toCents(totais.total_final),
    formaPrevista: entrega.formaPagamentoPrevista,
    trocoParaCents:
      entrega.trocoPara === null ? null : toCents(entrega.trocoPara),
  });

  return {
    entrega,
    cliente,
    itens: itens.map((item) => ({
      ...item,
      subtotal: fromCents(toCents(item.precoUnitario) * item.quantidade),
    })),
    valores: {
      subtotal: totais.subtotal,
      desconto: totais.desconto_aplicado,
      taxaEntrega: totais.taxa_entrega,
      taxaIsenta: entrega.taxaIsenta,
      total: totais.total_final,
    },
    pagamento: {
      forma: entrega.formaPagamentoPrevista,
      trocoPara: entrega.trocoPara,
      troco: fromCents(troco.trocoCents),
      trocoSuficiente: troco.suficiente,
    },
    ...situacaoDaCozinha(
      ativos
        .filter((item) => item.precisaPreparo)
        .map((item) => item.statusItem),
    ),
    historico,
  };
}
