import { fromCents, toCents } from "../../../shared/utils/money";
import { DescontoTipo } from "../../comandas/entities/comanda.entity";
import { FormaPagamento } from "../../comandas/entities/pagamento-comanda.entity";
import { calcularTotalComEntrega } from "../../comandas/services/total-com-entrega-calculator";
import { StatusItem } from "../../pedidos/entities/item-pedido.entity";
import { StatusPreparo } from "../../pedidos/entities/pedido.entity";
import { calcularStatusPreparoPedido } from "../../pedidos/services/status-preparo-calculator";
import { StatusEntrega } from "../entities/entrega.entity";
import { TRANSICOES_VALIDAS } from "./entrega-status-transition";
import { calcularTroco } from "./troco-calculator";

// Uma linha da consulta do painel (já agregada no banco: soma e status dos itens).
export interface LinhaPainelEntrega {
  id: string;
  numeroEntrega: number;
  statusEntrega: StatusEntrega;
  versao: number;
  clienteNome: string;
  clienteTelefone: string;
  enderecoLogradouro: string;
  enderecoNumero: string;
  enderecoComplemento: string | null;
  enderecoBairro: string;
  taxaEntrega: number;
  formaPagamentoPrevista: FormaPagamento;
  trocoPara: number | null;
  descontoTipo: DescontoTipo;
  descontoValor: number;
  subtotalItensAtivos: number;
  statusDosItens: StatusItem[];
  criadoEm: Date;
  previsaoEntregaEm: Date | null;
}

export interface CardPainelEntrega {
  id: string;
  numeroEntrega: number;
  statusEntrega: StatusEntrega;
  versao: number;
  cliente: { nome: string; telefone: string };
  bairro: string;
  enderecoResumido: string;
  total: number;
  formaPagamentoPrevista: FormaPagamento;
  troco: number;
  trocoSuficiente: boolean;
  criadoEm: Date;
  previsaoEntregaEm: Date | null;
  atrasado: boolean;
  statusPreparo: StatusPreparo;
}

// Terminal = não tem transição de saída (entregue, cancelado).
export const STATUS_TERMINAIS: readonly StatusEntrega[] = Object.values(StatusEntrega).filter(
  (status) => TRANSICOES_VALIDAS[status].length === 0
);

// Desconto fixo maior que os itens só acontece se itens foram cancelados depois do
// desconto; no painel ele é limitado ao valor dos itens (o fechamento recusaria esse caso).
function descontoParaExibicao(tipo: DescontoTipo, valor: number, subtotal: number): { tipo: DescontoTipo; valor: number } {
  return tipo === DescontoTipo.VALOR_FIXO ? { tipo, valor: Math.min(valor, subtotal) } : { tipo, valor };
}

// Monta o card do Kanban (PED-101) com os MESMOS cálculos do fechamento e da cotação:
// total = itens ativos − desconto + taxa; troco recalculado sobre o total atual.
export function montarCardPainel(linha: LinhaPainelEntrega, agora: Date): CardPainelEntrega {
  const { total_final: total } = calcularTotalComEntrega(
    linha.subtotalItensAtivos,
    descontoParaExibicao(linha.descontoTipo, linha.descontoValor, linha.subtotalItensAtivos),
    linha.taxaEntrega
  );
  const troco = calcularTroco({
    totalCents: toCents(total),
    formaPrevista: linha.formaPagamentoPrevista,
    trocoParaCents: linha.trocoPara === null ? null : toCents(linha.trocoPara),
  });
  const enderecoResumido = `${linha.enderecoLogradouro}, ${linha.enderecoNumero}${linha.enderecoComplemento ? ` - ${linha.enderecoComplemento}` : ""}`;

  return {
    id: linha.id,
    numeroEntrega: linha.numeroEntrega,
    statusEntrega: linha.statusEntrega,
    versao: linha.versao,
    cliente: { nome: linha.clienteNome, telefone: linha.clienteTelefone },
    bairro: linha.enderecoBairro,
    enderecoResumido,
    total,
    formaPagamentoPrevista: linha.formaPagamentoPrevista,
    troco: fromCents(troco.trocoCents),
    trocoSuficiente: troco.suficiente,
    criadoEm: linha.criadoEm,
    previsaoEntregaEm: linha.previsaoEntregaEm,
    atrasado:
      linha.previsaoEntregaEm !== null &&
      !STATUS_TERMINAIS.includes(linha.statusEntrega) &&
      agora.getTime() > linha.previsaoEntregaEm.getTime(),
    // Mesmo cálculo do KDS, sobre todos os itens da comanda.
    statusPreparo: calcularStatusPreparoPedido(linha.statusDosItens),
  };
}
