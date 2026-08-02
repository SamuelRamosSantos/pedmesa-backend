import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddAtivoToProdutos1700000000007 implements MigrationInterface {
  name = "AddAtivoToProdutos1700000000007";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "produtos",
      new TableColumn({
        name: "ativo",
        type: "boolean",
        default: true,
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("produtos", "ativo");
  }
}
