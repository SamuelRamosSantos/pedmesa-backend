import { MigrationInterface, QueryRunner } from "typeorm";

// PED-103: excluir item de uma comanda delivery grava o log sem número de mesa (delivery
// não tem mesa; a comanda continua identificada por comanda_id).
export class MakeNumeroComandaNullableInLogsExclusaoItem1700000000032 implements MigrationInterface {
  name = "MakeNumeroComandaNullableInLogsExclusaoItem1700000000032";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // SQL direto: changeColumn pode recriar a coluna no Postgres (ver skill dev-workflow).
    await queryRunner.query(`ALTER TABLE "logs_exclusao_item" ALTER COLUMN "numero_comanda" DROP NOT NULL`);
  }

  // Reverter recusa se já houver log de delivery: inventar um número de mesa falsificaria
  // a auditoria, e apagar o log perderia o registro.
  public async down(queryRunner: QueryRunner): Promise<void> {
    const [{ total }] = await queryRunner.query(
      `SELECT COUNT(*)::int AS total FROM "logs_exclusao_item" WHERE "numero_comanda" IS NULL`
    );

    if (total > 0) {
      throw new Error(
        `Não é possível reverter MakeNumeroComandaNullableInLogsExclusaoItem: existem ${total} log(s) de exclusão ` +
          "de itens de delivery (sem numero_comanda)."
      );
    }

    await queryRunner.query(`ALTER TABLE "logs_exclusao_item" ALTER COLUMN "numero_comanda" SET NOT NULL`);
  }
}
