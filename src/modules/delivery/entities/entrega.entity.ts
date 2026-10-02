import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  VersionColumn,
} from "typeorm";
import { Cliente } from "../../clientes/entities/cliente.entity";
import { Comanda } from "../../comandas/entities/comanda.entity";
import { FormaPagamento } from "../../comandas/entities/pagamento-comanda.entity";

export enum StatusEntrega {
  EM_PRODUCAO = "em_producao",
  PRONTO_PARA_ENVIO = "pronto_para_envio",
  EM_ROTA = "em_rota",
  ENTREGUE = "entregue",
  CANCELADO = "cancelado",
}

const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string) => Number.parseFloat(value),
};

const decimalNullableTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value === null ? null : Number.parseFloat(value)),
};

// Dados que só existem no delivery, 1:1 com a comanda (ADR-001).
//
// - O endereço é uma CÓPIA do momento do pedido: editar ou excluir o endereço do
//   cliente não altera entregas passadas.
// - O troco a devolver não é gravado: é derivado de troco_para e do total atual da
//   comanda (calculadora de troco), que pode mudar depois da criação.
// - No banco, as FKs são compostas com tenant_id ((comanda_id, tenant_id) e
//   (cliente_id, tenant_id)); aqui as relações usam só o id para o TypeORM não mapear
//   tenant_id duas vezes. Ver migration 1700000000028.
@Entity("entregas")
export class Entrega {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId!: string;

  @Column({ name: "comanda_id", type: "uuid" })
  comandaId!: string;

  @OneToOne(() => Comanda, { onDelete: "CASCADE" })
  @JoinColumn({ name: "comanda_id" })
  comanda!: Comanda;

  @Column({ name: "cliente_id", type: "uuid" })
  clienteId!: string;

  @ManyToOne(() => Cliente, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "cliente_id" })
  cliente!: Cliente;

  // Dia (no fuso do estabelecimento) em que o número foi gerado; o número reinicia a
  // cada dia e é único por (tenant_id, data_numeracao).
  @Column({ name: "data_numeracao", type: "date" })
  dataNumeracao!: string;

  @Column({ name: "numero_entrega", type: "int" })
  numeroEntrega!: number;

  @Column({ name: "endereco_cep", type: "char", length: 8 })
  enderecoCep!: string;

  @Column({ name: "endereco_logradouro", type: "varchar", length: 255 })
  enderecoLogradouro!: string;

  @Column({ name: "endereco_numero", type: "varchar", length: 20 })
  enderecoNumero!: string;

  @Column({ name: "endereco_complemento", type: "varchar", length: 100, nullable: true })
  enderecoComplemento!: string | null;

  @Column({ name: "endereco_bairro", type: "varchar", length: 120 })
  enderecoBairro!: string;

  @Column({ name: "endereco_cidade", type: "varchar", length: 120 })
  enderecoCidade!: string;

  @Column({ name: "endereco_uf", type: "char", length: 2 })
  enderecoUf!: string;

  @Column({ name: "endereco_referencia", type: "varchar", length: 255, nullable: true })
  enderecoReferencia!: string | null;

  @Column({ name: "taxa_entrega", type: "decimal", precision: 10, scale: 2, transformer: decimalTransformer })
  taxaEntrega!: number;

  @Column({
    name: "forma_pagamento_prevista",
    type: "enum",
    enum: FormaPagamento,
    enumName: "pagamentos_comanda_forma_enum",
  })
  formaPagamentoPrevista!: FormaPagamento;

  @Column({
    name: "troco_para",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: decimalNullableTransformer,
  })
  trocoPara!: number | null;

  @Column({
    name: "status_entrega",
    type: "enum",
    enum: StatusEntrega,
    enumName: "entregas_status_enum",
    default: StatusEntrega.EM_PRODUCAO,
  })
  statusEntrega!: StatusEntrega;

  // Optimistic locking do painel de expedição (PED-99): incrementada a cada save().
  @VersionColumn({ name: "versao", type: "int" })
  versao!: number;

  @Column({ name: "previsao_entrega_em", type: "timestamp", nullable: true })
  previsaoEntregaEm!: Date | null;

  @Column({ name: "saiu_em", type: "timestamp", nullable: true })
  saiuEm!: Date | null;

  @Column({ name: "entregue_em", type: "timestamp", nullable: true })
  entregueEm!: Date | null;

  @Column({ name: "motivo_cancelamento", type: "varchar", length: 255, nullable: true })
  motivoCancelamento!: string | null;

  @CreateDateColumn({ name: "criado_em", type: "timestamp" })
  criadoEm!: Date;
}
