import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddStatusAndPlanoIdToTenants1700000000019 implements MigrationInterface {
  name = "AddStatusAndPlanoIdToTenants1700000000019";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "tenants",
      new TableColumn({
        name: "status",
        type: "enum",
        enumName: "tenants_status_enum",
        enum: ["ativo", "suspenso", "cancelado"],
        default: "'ativo'",
        isNullable: false,
      })
    );

    await queryRunner.addColumn(
      "tenants",
      new TableColumn({
        name: "plano_id",
        type: "uuid",
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("tenants", "plano_id");
    await queryRunner.dropColumn("tenants", "status");
    await queryRunner.query(`DROP TYPE IF EXISTS "tenants_status_enum"`);
  }
}
