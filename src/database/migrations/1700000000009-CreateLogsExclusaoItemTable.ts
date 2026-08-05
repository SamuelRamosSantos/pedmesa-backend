import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateLogsExclusaoItemTable1700000000009 implements MigrationInterface {
  name = "CreateLogsExclusaoItemTable1700000000009";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "logs_exclusao_item",
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
            name: "comanda_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "numero_comanda",
            type: "int",
            isNullable: false,
          },
          {
            name: "pedido_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "produto_nome",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "quantidade",
            type: "int",
            isNullable: false,
          },
          {
            name: "preco_unitario",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: "excluido_por_usuario_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "criado_em",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      "logs_exclusao_item",
      new TableForeignKey({
        name: "fk_logs_exclusao_item_excluido_por_usuario_id",
        columnNames: ["excluido_por_usuario_id"],
        referencedTableName: "usuarios",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey("logs_exclusao_item", "fk_logs_exclusao_item_excluido_por_usuario_id");
    await queryRunner.dropTable("logs_exclusao_item");
  }
}
