import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddEnderecoToTenants1700000000014 implements MigrationInterface {
  name = "AddEnderecoToTenants1700000000014";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "tenants",
      new TableColumn({
        name: "logradouro",
        type: "varchar",
        length: "255",
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      "tenants",
      new TableColumn({
        name: "numero",
        type: "varchar",
        length: "20",
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      "tenants",
      new TableColumn({
        name: "bairro",
        type: "varchar",
        length: "255",
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      "tenants",
      new TableColumn({
        name: "cidade",
        type: "varchar",
        length: "255",
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      "tenants",
      new TableColumn({
        name: "estado",
        type: "varchar",
        length: "2",
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      "tenants",
      new TableColumn({
        name: "cep",
        type: "varchar",
        length: "9",
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("tenants", "cep");
    await queryRunner.dropColumn("tenants", "estado");
    await queryRunner.dropColumn("tenants", "cidade");
    await queryRunner.dropColumn("tenants", "bairro");
    await queryRunner.dropColumn("tenants", "numero");
    await queryRunner.dropColumn("tenants", "logradouro");
  }
}
