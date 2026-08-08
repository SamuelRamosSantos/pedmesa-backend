import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateAuditLogsTable1700000000020 implements MigrationInterface {
  name = "CreateAuditLogsTable1700000000020";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "audit_logs",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          {
            name: "super_admin_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "tenant_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "usuario_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "metodo",
            type: "varchar",
            length: "10",
            isNullable: false,
          },
          {
            name: "rota",
            type: "varchar",
            length: "512",
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

    await queryRunner.createForeignKey(
      "audit_logs",
      new TableForeignKey({
        name: "fk_audit_logs_super_admin_id",
        columnNames: ["super_admin_id"],
        referencedTableName: "super_admins",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey("audit_logs", "fk_audit_logs_super_admin_id");
    await queryRunner.dropTable("audit_logs");
  }
}
