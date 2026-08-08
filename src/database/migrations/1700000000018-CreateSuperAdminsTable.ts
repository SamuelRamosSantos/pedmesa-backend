import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateSuperAdminsTable1700000000018 implements MigrationInterface {
  name = "CreateSuperAdminsTable1700000000018";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "super_admins",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          {
            name: "nome",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "email",
            type: "varchar",
            length: "255",
            isNullable: false,
            isUnique: true,
          },
          {
            name: "senha_hash",
            type: "varchar",
            length: "255",
            isNullable: false,
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
    await queryRunner.dropTable("super_admins");
  }
}
