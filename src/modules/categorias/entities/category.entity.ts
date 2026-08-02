import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Tenant } from "../../tenants/entities/tenant.entity";

@Entity("categorias")
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant!: Tenant;

  @Column({ type: "varchar", length: 255 })
  nome!: string;

  @Column({ name: "ordem_exibicao", type: "int", default: 0 })
  ordemExibicao!: number;

  @Column({ type: "boolean", default: true })
  ativo!: boolean;
}
