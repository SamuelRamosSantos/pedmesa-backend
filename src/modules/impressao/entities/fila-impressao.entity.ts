import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Tenant } from "../../tenants/entities/tenant.entity";
import { PrintJobItemPayload } from "../types/print-job.types";

export enum StatusFilaImpressao {
  PENDENTE = "pendente",
  ENVIADO = "enviado",
  FALHOU = "falhou",
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

  @Column({ name: "pedido_id", type: "uuid" })
  pedidoId!: string;

  @Column({ name: "numero_comanda", type: "int" })
  numeroComanda!: number;

  @Column({ type: "jsonb" })
  payload!: PrintJobItemPayload[];

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
