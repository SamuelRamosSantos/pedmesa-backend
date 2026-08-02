import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "../../categorias/entities/category.entity";
import { Tenant } from "../../tenants/entities/tenant.entity";

@Entity("produtos")
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant!: Tenant;

  @Column({ name: "categoria_id", type: "uuid" })
  categoriaId!: string;

  @ManyToOne(() => Category, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "categoria_id" })
  categoria!: Category;

  @Column({ type: "varchar", length: 255 })
  nome!: string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number.parseFloat(value),
    },
  })
  preco!: number;

  @Column({ type: "text", nullable: true })
  descricao!: string | null;

  @Column({ type: "boolean", default: true })
  disponivel!: boolean;

  @Column({ name: "precisa_preparo", type: "boolean", default: true })
  precisaPreparo!: boolean;
}
