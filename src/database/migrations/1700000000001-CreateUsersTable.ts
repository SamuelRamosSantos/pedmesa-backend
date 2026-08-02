import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateUsersTable1700000000001 implements MigrationInterface {
  name = "CreateUsersTable1700000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "usuarios",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          {
            name: "tenant_id",
            type: "uuid",
            isNullable: false,
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
            name: "role",
            type: "enum",
            enumName: "usuarios_role_enum",
            enum: ["admin", "garcom", "cozinha", "caixa"],
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

    await queryRunner.createForeignKey(
      "usuarios",
      new TableForeignKey({
        name: "fk_usuarios_tenant_id",
        columnNames: ["tenant_id"],
        referencedTableName: "tenants",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey("usuarios", "fk_usuarios_tenant_id");
    await queryRunner.dropTable("usuarios");
    await queryRunner.query(`DROP TYPE IF EXISTS "usuarios_role_enum"`);
  }
}
