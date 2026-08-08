import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Tenant } from "../../tenants/entities/tenant.entity";
import { PrintJobItemPayload } from "../types/print-job.types";

export enum StatusFilaImpressao {
  PENDENTE = "pendente",
  ENVIADO = "enviado",
  FALHOU = "falhou",
}

export enum TipoFilaImpressao {
  PEDIDO_COZINHA = "pedido_cozinha",
  PRE_CONTA = "pre_conta",
}

@Entity("fila_impressao")
export class FilaImpressao {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant!: Tenant;

  @Column({
    type: "enum",
    enum: TipoFilaImpressao,
    enumName: "fila_impressao_tipo_enum",
    default: TipoFilaImpressao.PEDIDO_COZINHA,
  })
  tipo!: TipoFilaImpressao;

  @Column({ name: "comanda_id", type: "uuid", nullable: true })
  comandaId!: string | null;

  @Column({ name: "pedido_id", type: "uuid", nullable: true })
  pedidoId!: string | null;

  @Column({ name: "numero_comanda", type: "int" })
  numeroComanda!: number;

  @Column({ type: "jsonb" })
  payload!: PrintJobItemPayload[];

  @Column({
    name: "valor_total",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value === null ? null : Number.parseFloat(value)),
    },
  })
  valorTotal!: number | null;

  @Column({
    type: "enum",
    enum: StatusFilaImpressao,
    enumName: "fila_impressao_status_enum",
    default: StatusFilaImpressao.PENDENTE,
  })
  status!: StatusFilaImpressao;

  @Column({ type: "int", default: 0 })
  tentativas!: number;

  @Column({ name: "erro_mensagem", type: "text", nullable: true })
  erroMensagem!: string | null;

  @CreateDateColumn({ name: "criado_em", type: "timestamp" })
  criadoEm!: Date;

  @UpdateDateColumn({ name: "atualizado_em", type: "timestamp" })
  atualizadoEm!: Date;
}
