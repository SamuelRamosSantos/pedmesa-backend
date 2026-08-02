import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("tenants")
export class Tenant {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "nome_fantasia", type: "varchar", length: 255 })
  nomeFantasia!: string;

  @Column({ name: "cnpj_cpf", type: "varchar", length: 20, unique: true })
  cnpjCpf!: string;

  @Column({ type: "boolean", default: true })
  ativo!: boolean;

  @Column({ name: "quantidade_comandas", type: "int", default: 20 })
  quantidadeComandas!: number;

  @CreateDateColumn({ name: "criado_em", type: "timestamp" })
  criadoEm!: Date;
}
