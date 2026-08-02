import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddPrecisaPreparoToProdutos1700000000006 implements MigrationInterface {
  name = "AddPrecisaPreparoToProdutos1700000000006";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "produtos",
      new TableColumn({
        name: "precisa_preparo",
        type: "boolean",
        default: true,
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("produtos", "precisa_preparo");
  }
}
