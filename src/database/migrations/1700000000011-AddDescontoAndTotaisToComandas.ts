import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddDescontoAndTotaisToComandas1700000000011 implements MigrationInterface {
  name = "AddDescontoAndTotaisToComandas1700000000011";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "comandas",
      new TableColumn({
        name: "desconto_tipo",
        type: "enum",
        enumName: "comandas_desconto_tipo_enum",
        enum: ["percentual", "valor_fixo", "nenhum"],
        default: "'nenhum'",
        isNullable: false,
      })
    );

    await queryRunner.addColumn(
      "comandas",
      new TableColumn({
        name: "desconto_valor",
        type: "decimal",
        precision: 10,
        scale: 2,
        default: 0,
        isNullable: false,
      })
    );

    await queryRunner.addColumn(
      "comandas",
      new TableColumn({
        name: "subtotal",
        type: "decimal",
        precision: 10,
        scale: 2,
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      "comandas",
      new TableColumn({
        name: "total_final",
        type: "decimal",
        precision: 10,
        scale: 2,
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("comandas", "total_final");
    await queryRunner.dropColumn("comandas", "subtotal");
    await queryRunner.dropColumn("comandas", "desconto_valor");
    await queryRunner.dropColumn("comandas", "desconto_tipo");
    await queryRunner.query(`DROP TYPE IF EXISTS "comandas_desconto_tipo_enum"`);
  }
}
