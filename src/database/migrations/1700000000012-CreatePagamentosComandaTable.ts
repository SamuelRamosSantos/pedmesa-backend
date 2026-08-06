import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreatePagamentosComandaTable1700000000012 implements MigrationInterface {
  name = "CreatePagamentosComandaTable1700000000012";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "pagamentos_comanda",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          {
            name: "comanda_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "forma",
            type: "enum",
            enumName: "pagamentos_comanda_forma_enum",
            enum: ["pix", "dinheiro", "cartao_credito", "cartao_debito"],
            isNullable: false,
          },
          {
            name: "valor",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: "usuario_id",
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
      "pagamentos_comanda",
      new TableForeignKey({
        name: "fk_pagamentos_comanda_comanda_id",
        columnNames: ["comanda_id"],
        referencedTableName: "comandas",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "pagamentos_comanda",
      new TableForeignKey({
        name: "fk_pagamentos_comanda_usuario_id",
        columnNames: ["usuario_id"],
        referencedTableName: "usuarios",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey("pagamentos_comanda", "fk_pagamentos_comanda_usuario_id");
    await queryRunner.dropForeignKey("pagamentos_comanda", "fk_pagamentos_comanda_comanda_id");
    await queryRunner.dropTable("pagamentos_comanda");
    await queryRunner.query(`DROP TYPE IF EXISTS "pagamentos_comanda_forma_enum"`);
  }
}
