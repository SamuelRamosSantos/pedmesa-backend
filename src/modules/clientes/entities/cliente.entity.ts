import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Tenant } from "../../tenants/entities/tenant.entity";

// Cliente do delivery (ADR-001), identificado pelo telefone dentro do tenant.
// O telefone é sempre gravado normalizado (só dígitos, com DDD) pelos DTO validators.
@Entity("clientes")
export class Cliente {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant!: Tenant;

  @Column({ type: "varchar", length: 120 })
  nome!: string;

  @Column({ type: "varchar", length: 11 })
  telefone!: string;

  @Column({ type: "text", nullable: true })
  observacoes!: string | null;

  @Column({ type: "boolean", default: true })
  ativo!: boolean;

  @CreateDateColumn({ name: "criado_em", type: "timestamp" })
  criadoEm!: Date;

  @UpdateDateColumn({ name: "atualizado_em", type: "timestamp" })
  atualizadoEm!: Date;
}
