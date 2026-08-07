import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateImpressorasAndFilaImpressaoTables1700000000015 implements MigrationInterface {
  name = "CreateImpressorasAndFilaImpressaoTables1700000000015";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "impressoras",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, default: "uuid_generate_v4()" },
          { name: "tenant_id", type: "uuid", isNullable: false },
          { name: "nome", type: "varchar", length: "100", isNullable: false },
          { name: "ip", type: "varchar", length: "45", isNullable: false },
          { name: "porta", type: "int", default: 9100, isNullable: false },
          { name: "ativo", type: "boolean", default: true, isNullable: false },
          { name: "criado_em", type: "timestamp", default: "now()" },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      "impressoras",
      new TableForeignKey({
        name: "fk_impressoras_tenant_id",
        columnNames: ["tenant_id"],
        referencedTableName: "tenants",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createTable(
      new Table({
        name: "fila_impressao",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, default: "uuid_generate_v4()" },
          { name: "tenant_id", type: "uuid", isNullable: false },
          { name: "pedido_id", type: "uuid", isNullable: false },
          { name: "numero_comanda", type: "int", isNullable: false },
          { name: "payload", type: "jsonb", isNullable: false },
          {
            name: "status",
            type: "enum",
            enumName: "fila_impressao_status_enum",
            enum: ["pendente", "enviado", "falhou"],
            default: "'pendente'",
            isNullable: false,
          },
          { name: "tentativas", type: "int", default: 0, isNullable: false },
          { name: "erro_mensagem", type: "text", isNullable: true },
          { name: "criado_em", type: "timestamp", default: "now()" },
          { name: "atualizado_em", type: "timestamp", default: "now()" },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      "fila_impressao",
      new TableForeignKey({
        name: "fk_fila_impressao_tenant_id",
        columnNames: ["tenant_id"],
        referencedTableName: "tenants",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey("fila_impressao", "fk_fila_impressao_tenant_id");
    await queryRunner.dropTable("fila_impressao");
    await queryRunner.query(`DROP TYPE IF EXISTS "fila_impressao_status_enum"`);

    await queryRunner.dropForeignKey("impressoras", "fk_impressoras_tenant_id");
    await queryRunner.dropTable("impressoras");
  }
}
