import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddDadosEmpresaAndModuloCozinhaToTenants1700000000013 implements MigrationInterface {
  name = "AddDadosEmpresaAndModuloCozinhaToTenants1700000000013";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "tenants",
      new TableColumn({
        name: "razao_social",
        type: "varchar",
        length: "255",
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      "tenants",
      new TableColumn({
        name: "inscricao_estadual",
        type: "varchar",
        length: "30",
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      "tenants",
      new TableColumn({
        name: "ramo_atividade",
        type: "varchar",
        length: "255",
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      "tenants",
      new TableColumn({
        name: "nome_proprietario",
        type: "varchar",
        length: "255",
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      "tenants",
      new TableColumn({
        name: "cpf_proprietario",
        type: "varchar",
        length: "20",
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      "tenants",
      new TableColumn({
        name: "email_empresa",
        type: "varchar",
        length: "255",
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      "tenants",
      new TableColumn({
        name: "email_proprietario",
        type: "varchar",
        length: "255",
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      "tenants",
      new TableColumn({
        name: "usa_modulo_cozinha",
        type: "boolean",
        default: true,
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("tenants", "usa_modulo_cozinha");
    await queryRunner.dropColumn("tenants", "email_proprietario");
    await queryRunner.dropColumn("tenants", "email_empresa");
    await queryRunner.dropColumn("tenants", "cpf_proprietario");
    await queryRunner.dropColumn("tenants", "nome_proprietario");
    await queryRunner.dropColumn("tenants", "ramo_atividade");
    await queryRunner.dropColumn("tenants", "inscricao_estadual");
    await queryRunner.dropColumn("tenants", "razao_social");
  }
}
