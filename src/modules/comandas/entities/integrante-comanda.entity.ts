import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Comanda } from "./comanda.entity";

@Entity("integrantes_comanda")
export class IntegranteComanda {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "comanda_id", type: "uuid" })
  comandaId!: string;

  @ManyToOne(() => Comanda, (comanda) => comanda.integrantes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "comanda_id" })
  comanda!: Comanda;

  @Column({ type: "varchar", length: 255 })
  nome!: string;
}
