import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Cliente } from "./cliente.entity";

// Endereço salvo do cliente do delivery. No máximo um `principal` por cliente
// (índice único parcial). A FK composta (cliente_id, tenant_id) impede no banco um
// endereço com tenant diferente do cliente dono.
@Entity("enderecos_cliente")
export class EnderecoCliente {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "cliente_id", type: "uuid" })
  clienteId!: string;

  // A FK real no banco é composta (cliente_id, tenant_id) → clientes(id, tenant_id);
  // ver migration 1700000000026. Aqui a relação usa só cliente_id para o TypeORM
  // não mapear tenant_id duas vezes.
  @ManyToOne(() => Cliente, { onDelete: "CASCADE" })
  @JoinColumn({ name: "cliente_id" })
  cliente!: Cliente;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId!: string;

  @Column({ type: "char", length: 8 })
  cep!: string;

  @Column({ type: "varchar", length: 255 })
  logradouro!: string;

  @Column({ type: "varchar", length: 20 })
  numero!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  complemento!: string | null;

  @Column({ type: "varchar", length: 120 })
  bairro!: string;

  @Column({ type: "varchar", length: 120 })
  cidade!: string;

  @Column({ type: "char", length: 2 })
  uf!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  referencia!: string | null;

  @Column({ type: "boolean", default: false })
  principal!: boolean;

  @CreateDateColumn({ name: "criado_em", type: "timestamp" })
  criadoEm!: Date;
}
