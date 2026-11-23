import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from "typeorm";

// PED-127: "Entregue" registra sozinho um pagamento (PED-100). Para desfazer uma entrega
// marcada por engano, é preciso saber qual pagamento foi esse, e não apagar um que o
// caixa tenha lançado. SET NULL: se o caixa estornar esse pagamento, a referência some.
export class AddPagamentoAutomaticoToEntregas1700000000034
  implements MigrationInterface
{
  name = "AddPagamentoAutomaticoToEntregas1700000000034";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "entregas",
      new TableColumn({
        name: "pagamento_automatico_id",
        type: "uuid",
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      "entregas",
      new TableForeignKey({
        name: "fk_entregas_pagamento_automatico_id",
        columnNames: ["pagamento_automatico_id"],
        referencedTableName: "pagamentos_comanda",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      "entregas",
      "fk_entregas_pagamento_automatico_id",
    );
    await queryRunner.dropColumn("entregas", "pagamento_automatico_id");
  }
}
