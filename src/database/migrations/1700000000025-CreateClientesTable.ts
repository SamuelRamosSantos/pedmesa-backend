import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from "typeorm";

// PED-85: clientes do delivery (ADR-001). O telefone é único dentro do tenant e
// sempre gravado normalizado (só dígitos, com DDD) pelos DTO validators.
export class CreateClientesTable1700000000025 implements MigrationInterface {
  name = "CreateClientesTable1700000000025";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "clientes",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          {
            name: "tenant_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "nome",
            type: "varchar",
            length: "120",
            isNullable: false,
          },
          {
            name: "telefone",
            type: "varchar",
            length: "11",
            isNullable: false,
          },
          {
            name: "observacoes",
            type: "text",
            isNullable: true,
          },
          {
            name: "ativo",
            type: "boolean",
            default: true,
            isNullable: false,
          },
          {
            name: "criado_em",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "atualizado_em",
            type: "timestamp",
            default: "now()",
          },
        ],
        // O índice da constraint começa por tenant_id, então também atende as
        // buscas de clientes filtradas só pelo tenant.
        uniques: [
          new TableUnique({
            name: "ux_clientes_tenant_telefone",
            columnNames: ["tenant_id", "telefone"],
          }),
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      "clientes",
      new TableForeignKey({
        name: "fk_clientes_tenant_id",
        columnNames: ["tenant_id"],
        referencedTableName: "tenants",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("clientes");
  }
}
