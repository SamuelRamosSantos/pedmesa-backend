import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCanceladoToItensPedidoStatusEnum1700000000005 implements MigrationInterface {
  name = "AddCanceladoToItensPedidoStatusEnum1700000000005";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "itens_pedido_status_item_enum" ADD VALUE IF NOT EXISTS 'cancelado'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "itens_pedido" ALTER COLUMN "status_item" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "itens_pedido" ALTER COLUMN "status_item" TYPE varchar USING "status_item"::text`);
    await queryRunner.query(`DROP TYPE "itens_pedido_status_item_enum"`);
    await queryRunner.query(
      `CREATE TYPE "itens_pedido_status_item_enum" AS ENUM('pendente', 'em_preparo', 'pronto', 'entregue')`
    );
    await queryRunner.query(
      `ALTER TABLE "itens_pedido" ALTER COLUMN "status_item" TYPE "itens_pedido_status_item_enum" USING "status_item"::"itens_pedido_status_item_enum"`
    );
    await queryRunner.query(`ALTER TABLE "itens_pedido" ALTER COLUMN "status_item" SET DEFAULT 'pendente'`);
  }
}
