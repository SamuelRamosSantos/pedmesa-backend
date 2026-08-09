import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateLeadsTable1700000000021 implements MigrationInterface {
  name = "CreateLeadsTable1700000000021";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "leads",
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
          },
          {
            name: "whatsapp",
            type: "varchar",
            length: "20",
            isNullable: false,
          },
          {
            name: "nome_estabelecimento",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "cpf_cnpj",
            type: "varchar",
            length: "20",
            isNullable: false,
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
    await queryRunner.dropTable("leads");
  }
}
