import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../usuarios/entities/user.entity";

@Entity("logs_exclusao_item")
export class LogExclusaoItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId!: string;

  @Column({ name: "comanda_id", type: "uuid" })
  comandaId!: string;

  @Column({ name: "numero_comanda", type: "int" })
  numeroComanda!: number;

  @Column({ name: "pedido_id", type: "uuid" })
  pedidoId!: string;

  @Column({ name: "produto_nome", type: "varchar", length: 255 })
  produtoNome!: string;

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

  @Column({ name: "excluido_por_usuario_id", type: "uuid" })
  excluidoPorUsuarioId!: string;

  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "excluido_por_usuario_id" })
  excluidoPorUsuario!: User;

  @CreateDateColumn({ name: "criado_em", type: "timestamp" })
  criadoEm!: Date;
}
