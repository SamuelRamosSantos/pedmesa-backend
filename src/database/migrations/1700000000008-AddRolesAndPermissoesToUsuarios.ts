import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRolesAndPermissoesToUsuarios1700000000008 implements MigrationInterface {
  name = "AddRolesAndPermissoesToUsuarios1700000000008";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "usuarios" ADD COLUMN "roles" "usuarios_role_enum"[]`);
    await queryRunner.query(`UPDATE "usuarios" SET "roles" = ARRAY["role"]::"usuarios_role_enum"[]`);
    await queryRunner.query(`ALTER TABLE "usuarios" ALTER COLUMN "roles" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "role"`);

    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD COLUMN "pode_excluir_item_fechamento" boolean NOT NULL DEFAULT false`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "pode_excluir_item_fechamento"`);

    await queryRunner.query(`ALTER TABLE "usuarios" ADD COLUMN "role" "usuarios_role_enum"`);
    await queryRunner.query(`UPDATE "usuarios" SET "role" = "roles"[1]`);
    await queryRunner.query(`ALTER TABLE "usuarios" ALTER COLUMN "role" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "roles"`);
  }
}
