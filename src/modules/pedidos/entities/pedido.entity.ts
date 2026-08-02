import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Comanda } from "../../comandas/entities/comanda.entity";
import { User } from "../../usuarios/entities/user.entity";
import { ItemPedido } from "./item-pedido.entity";

export enum StatusPreparo {
  PENDENTE = "pendente",
  EM_PREPARO = "em_preparo",
  PRONTO = "pronto",
  ENTREGUE = "entregue",
}

@Entity("pedidos")
export class Pedido {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "comanda_id", type: "uuid" })
  comandaId!: string;

  @ManyToOne(() => Comanda, { onDelete: "CASCADE" })
  @JoinColumn({ name: "comanda_id" })
  comanda!: Comanda;

  @Column({ name: "usuario_id", type: "uuid" })
  usuarioId!: string;

  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "usuario_id" })
  usuario!: User;

  @Column({
    name: "status_preparo",
    type: "enum",
    enum: StatusPreparo,
    enumName: "pedidos_status_preparo_enum",
    default: StatusPreparo.PENDENTE,
  })
  statusPreparo!: StatusPreparo;

  @CreateDateColumn({ name: "criado_em", type: "timestamp" })
  criadoEm!: Date;

  @OneToMany(() => ItemPedido, (item) => item.pedido)
  itens!: ItemPedido[];
}
