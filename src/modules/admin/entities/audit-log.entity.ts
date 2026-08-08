import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { SuperAdmin } from "./super-admin.entity";

// Registra ações de escrita (POST/PATCH/PUT/DELETE) feitas por um tenant
// enquanto sua sessão foi gerada via "Acessar como" (impersonation, PED-41).
// tenant_id/usuario_id ficam como colunas soltas (sem FK) de propósito — é
// um log de auditoria, não deve sumir/quebrar se o registro de origem for
// alterado ou removido no futuro. Mesmo padrão de logs_exclusao_item.
@Entity("audit_logs")
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "super_admin_id", type: "uuid" })
  superAdminId!: string;

  @ManyToOne(() => SuperAdmin, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "super_admin_id" })
  superAdmin!: SuperAdmin;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId!: string;

  @Column({ name: "usuario_id", type: "uuid" })
  usuarioId!: string;

  @Column({ type: "varchar", length: 10 })
  metodo!: string;

  @Column({ type: "varchar", length: 512 })
  rota!: string;

  @CreateDateColumn({ name: "criado_em", type: "timestamp" })
  criadoEm!: Date;
}
