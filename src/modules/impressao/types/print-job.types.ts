export interface PrintJobItemPayload {
  produto_nome: string;
  quantidade: number;
  integrante_nome: string | null;
  observacao: string | null;
}

export interface PrintJobPayload {
  tenant_id: string;
  pedido_id: string;
  numero_comanda: number;
  criado_em: Date;
  itens: PrintJobItemPayload[];
}
