import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { IntegranteComanda } from "../../comandas/entities/integrante-comanda.entity";
import { Product } from "../../produtos/entities/product.entity";
import { Pedido } from "./pedido.entity";

export enum StatusItem {
  PENDENTE = "pendente",
  EM_PREPARO = "em_preparo",
  PRONTO = "pronto",
  ENTREGUE = "entregue",
  CANCELADO = "cancelado",
}

@Entity("itens_pedido")
export class ItemPedido {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "pedido_id", type: "uuid" })
  pedidoId!: string;

  @ManyToOne(() => Pedido, (pedido) => pedido.itens, { onDelete: "CASCADE" })
  @JoinColumn({ name: "pedido_id" })
  pedido!: Pedido;

  @Column({ name: "produto_id", type: "uuid" })
  produtoId!: string;

  @ManyToOne(() => Product, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "produto_id" })
  produto!: Product;

  @Column({ name: "integrante_id", type: "uuid", nullable: true })
  integranteId!: string | null;

  @ManyToOne(() => IntegranteComanda, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "integrante_id" })
  integrante!: IntegranteComanda | null;

  @Column({ type: "int" })
  quantidade!: number;

  @Column({
    name: "preco_unitario",
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number.parseFloat(value),
    },
  })
  precoUnitario!: number;

  @Column({ type: "text", nullable: true })
  observacao!: string | null;

  @Column({
    name: "status_item",
    type: "enum",
    enum: StatusItem,
    enumName: "itens_pedido_status_item_enum",
    default: StatusItem.PENDENTE,
  })
  statusItem!: StatusItem;
}
