import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

// Captado pelo formulário público da landing page (pedmesa-site, PED-48) —
// não tem tenant_id porque ainda não existe estabelecimento nenhum nesse
// ponto, é só um contato interessado. Visualizado depois via /admin/leads
// (super-admin).
@Entity("leads")
export class Lead {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  nome!: string;

  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ type: "varchar", length: 20 })
  whatsapp!: string;

  @Column({ name: "nome_estabelecimento", type: "varchar", length: 255 })
  nomeEstabelecimento!: string;

  @Column({ name: "cpf_cnpj", type: "varchar", length: 20 })
  cpfCnpj!: string;

  @CreateDateColumn({ name: "criado_em", type: "timestamp" })
  criadoEm!: Date;
}
