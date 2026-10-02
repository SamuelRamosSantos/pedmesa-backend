import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex, TableUnique } from "typeorm";

// PED-86: endereços salvos dos clientes do delivery (ADR-001).
//
// - FK composta (cliente_id, tenant_id) → clientes(id, tenant_id): o banco impede um
//   endereço com tenant diferente do cliente dono. Para isso, clientes ganha a
//   unique (id, tenant_id), exigida pelo Postgres como alvo de FK composta.
// - Índice único parcial (cliente_id) WHERE principal: no máximo um endereço
//   principal por cliente.
const UNIQUE_CLIENTES_ID_TENANT = "ux_clientes_id_tenant";

export class CreateEnderecosClienteTable1700000000026 implements MigrationInterface {
  name = "CreateEnderecosClienteTable1700000000026";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createUniqueConstraint(
      "clientes",
      new TableUnique({ name: UNIQUE_CLIENTES_ID_TENANT, columnNames: ["id", "tenant_id"] })
    );

    await queryRunner.createTable(
      new Table({
        name: "enderecos_cliente",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, default: "uuid_generate_v4()" },
          { name: "cliente_id", type: "uuid", isNullable: false },
          { name: "tenant_id", type: "uuid", isNullable: false },
          { name: "cep", type: "char", length: "8", isNullable: false },
          { name: "logradouro", type: "varchar", length: "255", isNullable: false },
          { name: "numero", type: "varchar", length: "20", isNullable: false },
          { name: "complemento", type: "varchar", length: "100", isNullable: true },
          { name: "bairro", type: "varchar", length: "120", isNullable: false },
          { name: "cidade", type: "varchar", length: "120", isNullable: false },
          { name: "uf", type: "char", length: "2", isNullable: false },
          { name: "referencia", type: "varchar", length: "255", isNullable: true },
          { name: "principal", type: "boolean", default: false, isNullable: false },
          { name: "criado_em", type: "timestamp", default: "now()" },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      "enderecos_cliente",
      new TableForeignKey({
        name: "fk_enderecos_cliente_cliente_tenant",
        columnNames: ["cliente_id", "tenant_id"],
        referencedTableName: "clientes",
        referencedColumnNames: ["id", "tenant_id"],
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createIndex(
      "enderecos_cliente",
      new TableIndex({
        name: "ux_enderecos_cliente_principal",
        columnNames: ["cliente_id"],
        isUnique: true,
        where: `"principal" = true`,
      })
    );

    // Listagem dos endereços de um cliente (formulário do delivery).
    await queryRunner.createIndex(
      "enderecos_cliente",
      new TableIndex({ name: "ix_enderecos_cliente_cliente_id", columnNames: ["cliente_id"] })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("enderecos_cliente");
    await queryRunner.dropUniqueConstraint("clientes", UNIQUE_CLIENTES_ID_TENANT);
  }
}
