export interface PrintJobItemPayload {
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  integrante_nome: string | null;
  observacao: string | null;
}

export interface PrintJobPayload {
  tenant_id: string;
  comanda_id: string;
  pedido_id: string;
  // Um dos dois identifica o pedido no cupom: mesa (numero_comanda) ou delivery (numero_entrega).
  numero_comanda: number | null;
  numero_entrega: number | null;
  criado_em: Date;
  itens: PrintJobItemPayload[];
}

export interface PreContaJobPayload {
  tenant_id: string;
  comanda_id: string;
  numero_comanda: number;
  gerado_em: Date;
  itens: PrintJobItemPayload[];
  valor_total: number;
}

// Dados do cupom do motoboy (PED-102), gravados em fila_impressao.dados_entrega.
export interface DadosEntregaTicket {
  cliente_nome: string;
  cliente_telefone: string;
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
  subtotal: number;
  taxa_entrega: number;
  total: number;
  forma_pagamento: string;
  troco_para: number | null;
  troco: number;
}

export interface EntregaJobPayload {
  tenant_id: string;
  comanda_id: string;
  numero_entrega: number;
  gerado_em: Date;
  itens: PrintJobItemPayload[];
  dados: DadosEntregaTicket;
}
