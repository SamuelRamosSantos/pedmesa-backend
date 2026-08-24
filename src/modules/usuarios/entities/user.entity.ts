import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Tenant } from "../../tenants/entities/tenant.entity";

export enum UserRole {
  ADMIN = "admin",
  GARCOM = "garcom",
  COZINHA = "cozinha",
  CAIXA = "caixa",
}

@Entity("usuarios")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant!: Tenant;

  @Column({ type: "varchar", length: 255 })
  nome!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ name: "senha_hash", type: "varchar", length: 255 })
  senhaHash!: string;

  @Column({ type: "enum", enum: UserRole, enumName: "usuarios_role_enum", array: true })
  roles!: UserRole[];

  @Column({ name: "pode_excluir_item_fechamento", type: "boolean", default: false })
  podeExcluirItemFechamento!: boolean;

  @Column({ name: "pode_conceder_desconto", type: "boolean", default: false })
  podeConcederDesconto!: boolean;

  @Column({ type: "boolean", default: true })
  ativo!: boolean;

  @Column({ name: "foto_url", type: "varchar", length: 1024, nullable: true })
  fotoUrl!: string | null;

  @CreateDateColumn({ name: "criado_em", type: "timestamp" })
  criadoEm!: Date;
}
