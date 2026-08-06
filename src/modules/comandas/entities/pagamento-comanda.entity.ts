import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../usuarios/entities/user.entity";
import { Comanda } from "./comanda.entity";

export enum FormaPagamento {
  PIX = "pix",
  DINHEIRO = "dinheiro",
  CARTAO_CREDITO = "cartao_credito",
  CARTAO_DEBITO = "cartao_debito",
}

@Entity("pagamentos_comanda")
export class PagamentoComanda {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "comanda_id", type: "uuid" })
  comandaId!: string;

  @ManyToOne(() => Comanda, { onDelete: "CASCADE" })
  @JoinColumn({ name: "comanda_id" })
  comanda!: Comanda;

  @Column({ type: "enum", enum: FormaPagamento, enumName: "pagamentos_comanda_forma_enum" })
  forma!: FormaPagamento;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number.parseFloat(value),
    },
  })
  valor!: number;

  @Column({ name: "usuario_id", type: "uuid" })
  usuarioId!: string;

  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "usuario_id" })
  usuario!: User;

  @CreateDateColumn({ name: "criado_em", type: "timestamp" })
  criadoEm!: Date;
}
