import { FormaPagamento } from "../../comandas/entities/pagamento-comanda.entity";
import { StatusItem } from "../../pedidos/entities/item-pedido.entity";
import { StatusPreparo } from "../../pedidos/entities/pedido.entity";
import { StatusEntrega } from "../entities/entrega.entity";
import { DetalheEntrega } from "../services/detalhe-entrega";

// GET /delivery/entregas/:id (PED-130).
export interface DetalheEntregaResponse {
  id: string;
  numero_entrega: number;
  status_entrega: StatusEntrega;
  versao: number;
  cliente: { nome: string; telefone: string };
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string | null;
    bairro: string;
    cidade: string;
    uf: string;
    referencia: string | null;
  };
  itens: {
    id: string;
    produto: string;
    quantidade: number;
    preco_unitario: number;
    subtotal: number;
    observacao: string | null;
    status_item: StatusItem;
    precisa_preparo: boolean;
  }[];
  valores: {
    subtotal: number;
    desconto: number;
    taxa_entrega: number;
    taxa_isenta: boolean;
    total: number;
  };
  pagamento: {
    forma: FormaPagamento;
    troco_para: number | null;
    troco: number;
    troco_suficiente: boolean;
  };
  status_preparo: StatusPreparo;
  passa_pela_cozinha: boolean;
  criado_em: Date;
  previsao_entrega_em: Date | null;
  saiu_em: Date | null;
  entregue_em: Date | null;
  motivo_cancelamento: string | null;
  historico: {
    status_anterior: StatusEntrega | null;
    status_novo: StatusEntrega;
    motivo: string | null;
    usuario_nome: string | null;
    criado_em: Date;
  }[];
}

export function toDetalheEntregaResponse(
  detalhe: DetalheEntrega,
): DetalheEntregaResponse {
  const { entrega } = detalhe;

  return {
    id: entrega.id,
    numero_entrega: entrega.numeroEntrega,
    status_entrega: entrega.statusEntrega,
    versao: entrega.versao,
    cliente: detalhe.cliente,
    endereco: {
      cep: entrega.enderecoCep,
      logradouro: entrega.enderecoLogradouro,
      numero: entrega.enderecoNumero,
      complemento: entrega.enderecoComplemento,
      bairro: entrega.enderecoBairro,
      cidade: entrega.enderecoCidade,
      uf: entrega.enderecoUf,
      referencia: entrega.enderecoReferencia,
    },
    itens: detalhe.itens.map((item) => ({
      id: item.id,
      produto: item.produto,
      quantidade: item.quantidade,
      preco_unitario: item.precoUnitario,
      subtotal: item.subtotal,
      observacao: item.observacao,
      status_item: item.statusItem,
      precisa_preparo: item.precisaPreparo,
    })),
    valores: {
      subtotal: detalhe.valores.subtotal,
      desconto: detalhe.valores.desconto,
      taxa_entrega: detalhe.valores.taxaEntrega,
      taxa_isenta: detalhe.valores.taxaIsenta,
      total: detalhe.valores.total,
    },
    pagamento: {
      forma: detalhe.pagamento.forma,
      troco_para: detalhe.pagamento.trocoPara,
      troco: detalhe.pagamento.troco,
      troco_suficiente: detalhe.pagamento.trocoSuficiente,
    },
    status_preparo: detalhe.statusPreparo,
    passa_pela_cozinha: detalhe.passaPelaCozinha,
    criado_em: entrega.criadoEm,
    previsao_entrega_em: entrega.previsaoEntregaEm,
    saiu_em: entrega.saiuEm,
    entregue_em: entrega.entregueEm,
    motivo_cancelamento: entrega.motivoCancelamento,
    historico: detalhe.historico.map((registro) => ({
      status_anterior: registro.statusAnterior,
      status_novo: registro.statusNovo,
      motivo: registro.motivo,
      usuario_nome: registro.usuarioNome,
      criado_em: registro.criadoEm,
    })),
  };
}
