import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddImagemUrlToProdutos1700000000022 implements MigrationInterface {
  name = "AddImagemUrlToProdutos1700000000022";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "produtos",
      new TableColumn({
        name: "imagem_url",
        type: "varchar",
        length: "1024",
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("produtos", "imagem_url");
  }
}
