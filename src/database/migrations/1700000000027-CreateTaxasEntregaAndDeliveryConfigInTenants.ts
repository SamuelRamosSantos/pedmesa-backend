import { MigrationInterface, QueryRunner, Table, TableCheck, TableColumn, TableForeignKey, TableUnique } from "typeorm";

// PED-87: frete por bairro (ADR-001) e configuração de delivery por tenant.
//
// As colunas *_normalizado são preenchidas pela entidade TaxaEntrega (normalizarLocalidade)
// e são a chave de unicidade: "Jardim São Paulo" e "jardim sao paulo" não podem coexistir
// no mesmo tenant e cidade.
const CHECK_TAXA_PADRAO_NAO_NEGATIVA = "ck_tenants_taxa_entrega_padrao_nao_negativa";
const CHECK_PEDIDO_MINIMO_NAO_NEGATIVO = "ck_tenants_pedido_minimo_delivery_nao_negativo";

export class CreateTaxasEntregaAndDeliveryConfigInTenants1700000000027 implements MigrationInterface {
  name = "CreateTaxasEntregaAndDeliveryConfigInTenants1700000000027";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "taxas_entrega",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, default: "uuid_generate_v4()" },
          { name: "tenant_id", type: "uuid", isNullable: false },
          { name: "cidade", type: "varchar", length: "120", isNullable: false },
          { name: "bairro", type: "varchar", length: "120", isNullable: false },
          { name: "cidade_normalizada", type: "varchar", length: "120", isNullable: false },
          { name: "bairro_normalizado", type: "varchar", length: "120", isNullable: false },
          { name: "valor", type: "decimal", precision: 10, scale: 2, isNullable: false },
          { name: "tempo_estimado_min", type: "int", isNullable: true },
          { name: "ativo", type: "boolean", default: true, isNullable: false },
        ],
        uniques: [
          new TableUnique({
            name: "ux_taxas_entrega_tenant_localidade",
            columnNames: ["tenant_id", "cidade_normalizada", "bairro_normalizado"],
          }),
        ],
        checks: [
          new TableCheck({ name: "ck_taxas_entrega_valor_nao_negativo", expression: `"valor" >= 0` }),
          new TableCheck({
            name: "ck_taxas_entrega_tempo_estimado_positivo",
            expression: `"tempo_estimado_min" IS NULL OR "tempo_estimado_min" > 0`,
          }),
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      "taxas_entrega",
      new TableForeignKey({
        name: "fk_taxas_entrega_tenant_id",
        columnNames: ["tenant_id"],
        referencedTableName: "tenants",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );

    await queryRunner.addColumns("tenants", [
      new TableColumn({ name: "delivery_ativo", type: "boolean", default: false, isNullable: false }),
      new TableColumn({ name: "taxa_entrega_padrao", type: "decimal", precision: 10, scale: 2, isNullable: true }),
      new TableColumn({
        name: "pedido_minimo_delivery",
        type: "decimal",
        precision: 10,
        scale: 2,
        default: 0,
        isNullable: false,
      }),
    ]);

    await queryRunner.createCheckConstraints("tenants", [
      new TableCheck({
        name: CHECK_TAXA_PADRAO_NAO_NEGATIVA,
        expression: `"taxa_entrega_padrao" IS NULL OR "taxa_entrega_padrao" >= 0`,
      }),
      new TableCheck({ name: CHECK_PEDIDO_MINIMO_NAO_NEGATIVO, expression: `"pedido_minimo_delivery" >= 0` }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropCheckConstraint("tenants", CHECK_PEDIDO_MINIMO_NAO_NEGATIVO);
    await queryRunner.dropCheckConstraint("tenants", CHECK_TAXA_PADRAO_NAO_NEGATIVA);
    await queryRunner.dropColumns("tenants", ["pedido_minimo_delivery", "taxa_entrega_padrao", "delivery_ativo"]);
    await queryRunner.dropTable("taxas_entrega");
  }
}
