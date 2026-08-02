import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Tenant } from "../../tenants/entities/tenant.entity";
import { IntegranteComanda } from "./integrante-comanda.entity";

export enum ComandaStatus {
  ABERTA = "aberta",
  FECHADA = "fechada",
}

@Entity("comandas")
export class Comanda {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant!: Tenant;

  @Column({ name: "numero_comanda", type: "int" })
  numeroComanda!: number;

  @Column({ type: "enum", enum: ComandaStatus, enumName: "comandas_status_enum", default: ComandaStatus.ABERTA })
  status!: ComandaStatus;

  @Column({ name: "comanda_pai_id", type: "uuid", nullable: true })
  comandaPaiId!: string | null;

  @ManyToOne(() => Comanda, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "comanda_pai_id" })
  comandaPai!: Comanda | null;

  @CreateDateColumn({ name: "aberta_em", type: "timestamp" })
  abertaEm!: Date;

  @Column({ name: "fechada_em", type: "timestamp", nullable: true })
  fechadaEm!: Date | null;

  @OneToMany(() => IntegranteComanda, (integrante) => integrante.comanda)
  integrantes!: IntegranteComanda[];
}
