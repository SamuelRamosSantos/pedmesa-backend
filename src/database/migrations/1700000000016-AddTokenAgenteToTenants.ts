import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddTokenAgenteToTenants1700000000016 implements MigrationInterface {
  name = "AddTokenAgenteToTenants1700000000016";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "tenants",
      new TableColumn({
        name: "token_agente",
        type: "varchar",
        length: "64",
        isNullable: true,
        isUnique: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("tenants", "token_agente");
  }
}
