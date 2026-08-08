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
  numero_comanda: number;
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
