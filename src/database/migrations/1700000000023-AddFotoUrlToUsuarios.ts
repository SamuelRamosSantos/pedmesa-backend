import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddFotoUrlToUsuarios1700000000023 implements MigrationInterface {
  name = "AddFotoUrlToUsuarios1700000000023";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "usuarios",
      new TableColumn({
        name: "foto_url",
        type: "varchar",
        length: "1024",
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("usuarios", "foto_url");
  }
}
