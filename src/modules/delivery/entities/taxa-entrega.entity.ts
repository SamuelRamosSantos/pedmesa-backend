import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Tenant } from "../../tenants/entities/tenant.entity";
import { normalizarLocalidade } from "../services/localidade-normalizer";

// Taxa de frete por bairro (ADR-001). As colunas *_normalizado são a chave de busca
// e de unicidade, e são preenchidas pela própria entidade antes de gravar.
//
// Atenção: os hooks só rodam com save(). Um repository.update() ou um
// createQueryBuilder().update() não recalcula as colunas normalizadas; ao alterar
// cidade ou bairro, carregue a entidade e use save().
@Entity("taxas_entrega")
export class TaxaEntrega {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant!: Tenant;

  @Column({ type: "varchar", length: 120 })
  cidade!: string;

  @Column({ type: "varchar", length: 120 })
  bairro!: string;

  @Column({ name: "cidade_normalizada", type: "varchar", length: 120 })
  cidadeNormalizada!: string;

  @Column({ name: "bairro_normalizado", type: "varchar", length: 120 })
  bairroNormalizado!: string;

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

  @Column({ name: "tempo_estimado_min", type: "int", nullable: true })
  tempoEstimadoMin!: number | null;

  @Column({ type: "boolean", default: true })
  ativo!: boolean;

  @BeforeInsert()
  @BeforeUpdate()
  preencherLocalidadeNormalizada(): void {
    this.cidadeNormalizada = normalizarLocalidade(this.cidade);
    this.bairroNormalizado = normalizarLocalidade(this.bairro);
  }
}
