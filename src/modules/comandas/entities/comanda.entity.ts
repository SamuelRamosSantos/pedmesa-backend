import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Tenant } from "../../tenants/entities/tenant.entity";
import { IntegranteComanda } from "./integrante-comanda.entity";

export enum ComandaStatus {
  ABERTA = "aberta",
  FECHADA = "fechada",
}

export enum DescontoTipo {
  PERCENTUAL = "percentual",
  VALOR_FIXO = "valor_fixo",
  NENHUM = "nenhum",
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

  @Column({
    name: "desconto_tipo",
    type: "enum",
    enum: DescontoTipo,
    enumName: "comandas_desconto_tipo_enum",
    default: DescontoTipo.NENHUM,
  })
  descontoTipo!: DescontoTipo;

  @Column({
    name: "desconto_valor",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number.parseFloat(value),
    },
  })
  descontoValor!: number;

  @Column({
    name: "subtotal",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value === null ? null : Number.parseFloat(value)),
    },
  })
  subtotal!: number | null;

  @Column({
    name: "total_final",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value === null ? null : Number.parseFloat(value)),
    },
  })
  totalFinal!: number | null;

  @OneToMany(() => IntegranteComanda, (integrante) => integrante.comanda)
  integrantes!: IntegranteComanda[];
}
