import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../usuarios/entities/user.entity";
import { Entrega, StatusEntrega } from "./entrega.entity";

// Trilha de auditoria append-only das transições de status da entrega (base para
// métricas de tempo de preparo, espera e rota).
//
// - Só é gravada por registrarHistoricoStatusEntrega(), dentro da transação que muda
//   o status. Não existe endpoint de update nem de delete.
// - O banco reforça isso: um trigger recusa UPDATE e DELETE direto; o DELETE em
//   cascata (ao excluir a entrega ou o tenant) continua permitido.
// - usuario_id é NULL quando a transição é automática (ex.: sincronização com a
//   cozinha, PED-98).
@Entity("historico_status_entrega")
export class HistoricoStatusEntrega {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId!: string;

  @Column({ name: "entrega_id", type: "uuid" })
  entregaId!: string;

  // A FK real é composta (entrega_id, tenant_id); ver migration 1700000000029.
  @ManyToOne(() => Entrega, { onDelete: "CASCADE" })
  @JoinColumn({ name: "entrega_id" })
  entrega!: Entrega;

  @Column({
    name: "status_anterior",
    type: "enum",
    enum: StatusEntrega,
    enumName: "entregas_status_enum",
    nullable: true,
  })
  statusAnterior!: StatusEntrega | null;

  @Column({ name: "status_novo", type: "enum", enum: StatusEntrega, enumName: "entregas_status_enum" })
  statusNovo!: StatusEntrega;

  @Column({ name: "usuario_id", type: "uuid", nullable: true })
  usuarioId!: string | null;

  @ManyToOne(() => User, { onDelete: "RESTRICT", nullable: true })
  @JoinColumn({ name: "usuario_id" })
  usuario!: User | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  motivo!: string | null;

  @CreateDateColumn({ name: "criado_em", type: "timestamp" })
  criadoEm!: Date;
}
