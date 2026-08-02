import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateTenantsTable1700000000000 implements MigrationInterface {
  name = "CreateTenantsTable1700000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.createTable(
      new Table({
        name: "tenants",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          {
            name: "nome_fantasia",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "cnpj_cpf",
            type: "varchar",
            length: "20",
            isNullable: false,
            isUnique: true,
          },
          {
            name: "ativo",
            type: "boolean",
            default: true,
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("tenants");
  }
}
