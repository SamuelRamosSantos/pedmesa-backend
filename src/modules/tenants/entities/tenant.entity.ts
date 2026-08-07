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

  @Column({ name: "razao_social", type: "varchar", length: 255, nullable: true })
  razaoSocial!: string | null;

  @Column({ name: "inscricao_estadual", type: "varchar", length: 30, nullable: true })
  inscricaoEstadual!: string | null;

  @Column({ name: "ramo_atividade", type: "varchar", length: 255, nullable: true })
  ramoAtividade!: string | null;

  @Column({ name: "nome_proprietario", type: "varchar", length: 255, nullable: true })
  nomeProprietario!: string | null;

  @Column({ name: "cpf_proprietario", type: "varchar", length: 20, nullable: true })
  cpfProprietario!: string | null;

  @Column({ name: "email_empresa", type: "varchar", length: 255, nullable: true })
  emailEmpresa!: string | null;

  @Column({ name: "email_proprietario", type: "varchar", length: 255, nullable: true })
  emailProprietario!: string | null;

  @Column({ name: "usa_modulo_cozinha", type: "boolean", default: true })
  usaModuloCozinha!: boolean;

  @Column({ name: "logradouro", type: "varchar", length: 255, nullable: true })
  logradouro!: string | null;

  @Column({ name: "numero", type: "varchar", length: 20, nullable: true })
  numero!: string | null;

  @Column({ name: "bairro", type: "varchar", length: 255, nullable: true })
  bairro!: string | null;

  @Column({ name: "cidade", type: "varchar", length: 255, nullable: true })
  cidade!: string | null;

  @Column({ name: "estado", type: "varchar", length: 2, nullable: true })
  estado!: string | null;

  @Column({ name: "cep", type: "varchar", length: 9, nullable: true })
  cep!: string | null;

  @Column({ name: "token_agente", type: "varchar", length: 64, nullable: true, unique: true })
  tokenAgente!: string | null;

  @CreateDateColumn({ name: "criado_em", type: "timestamp" })
  criadoEm!: Date;
}
