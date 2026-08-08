import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddPreContaSupportToFilaImpressao1700000000017 implements MigrationInterface {
  name = "AddPreContaSupportToFilaImpressao1700000000017";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "fila_impressao",
      new TableColumn({
        name: "tipo",
        type: "enum",
        enumName: "fila_impressao_tipo_enum",
        enum: ["pedido_cozinha", "pre_conta"],
        default: "'pedido_cozinha'",
        isNullable: false,
      })
    );

    await queryRunner.addColumn(
      "fila_impressao",
      new TableColumn({
        name: "comanda_id",
        type: "uuid",
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      "fila_impressao",
      new TableColumn({
        name: "valor_total",
        type: "decimal",
        precision: 10,
        scale: 2,
        isNullable: true,
      })
    );

    // registros existentes são todos de pedido de cozinha (única modalidade
    // até aqui) — preenche o comanda_id via join com pedidos, best-effort
    // (pedidos apagados deixam comanda_id nulo mesmo, sem problema pra
    // registros históricos).
    await queryRunner.query(`
      UPDATE fila_impressao fi
      SET comanda_id = p.comanda_id
      FROM pedidos p
      WHERE p.id = fi.pedido_id AND fi.comanda_id IS NULL
    `);

    await queryRunner.changeColumn(
      "fila_impressao",
      "pedido_id",
      new TableColumn({
        name: "pedido_id",
        type: "uuid",
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      "fila_impressao",
      "pedido_id",
      new TableColumn({
        name: "pedido_id",
        type: "uuid",
        isNullable: false,
      })
    );
    await queryRunner.dropColumn("fila_impressao", "valor_total");
    await queryRunner.dropColumn("fila_impressao", "comanda_id");
    await queryRunner.dropColumn("fila_impressao", "tipo");
    await queryRunner.query(`DROP TYPE IF EXISTS "fila_impressao_tipo_enum"`);
  }
}
