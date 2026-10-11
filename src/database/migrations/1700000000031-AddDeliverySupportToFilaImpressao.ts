import { MigrationInterface, QueryRunner, TableCheck, TableColumn } from "typeorm";

// PED-96/PED-102: impressão de pedidos delivery.
// - tipo 'entrega' (cupom do motoboy);
// - numero_comanda passa a aceitar NULL (delivery não tem mesa) e entra numero_entrega;
//   o CHECK exige pelo menos um dos dois, para todo cupom ter identificação;
// - dados_entrega guarda cliente, endereço e valores do cupom do motoboy.
//
// ADD VALUE roda dentro da transação das migrations (modo "all"): aceito desde o
// Postgres 12, pois esta migration não USA o valor novo. Não há `transaction = false`
// porque o TypeORM recusa esse ajuste no modo "all" (ver migration 030).
const CHECK_IDENTIFICACAO = "ck_fila_impressao_identificacao";

export class AddDeliverySupportToFilaImpressao1700000000031 implements MigrationInterface {
  name = "AddDeliverySupportToFilaImpressao1700000000031";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "fila_impressao_tipo_enum" ADD VALUE IF NOT EXISTS 'entrega'`);

    // SQL direto: changeColumn pode recriar a coluna no Postgres (ver skill dev-workflow).
    await queryRunner.query(`ALTER TABLE "fila_impressao" ALTER COLUMN "numero_comanda" DROP NOT NULL`);

    await queryRunner.addColumns("fila_impressao", [
      new TableColumn({ name: "numero_entrega", type: "int", isNullable: true }),
      new TableColumn({ name: "dados_entrega", type: "jsonb", isNullable: true }),
    ]);

    await queryRunner.createCheckConstraint(
      "fila_impressao",
      new TableCheck({
        name: CHECK_IDENTIFICACAO,
        expression: `"numero_comanda" IS NOT NULL OR "numero_entrega" IS NOT NULL`,
      })
    );
  }

  // O Postgres não remove valor de enum: 'entrega' continua no tipo, sem efeito para o código
  // anterior. Reverter recusa se houver jobs de delivery, para não apagar dados.
  public async down(queryRunner: QueryRunner): Promise<void> {
    const [{ total }] = await queryRunner.query(
      `SELECT COUNT(*)::int AS total FROM "fila_impressao" WHERE "numero_comanda" IS NULL OR "tipo"::text = 'entrega'`
    );

    if (total > 0) {
      throw new Error(
        `Não é possível reverter AddDeliverySupportToFilaImpressao: existem ${total} job(s) de delivery em fila_impressao. ` +
          "Remova-os antes de reverter."
      );
    }

    await queryRunner.dropCheckConstraint("fila_impressao", CHECK_IDENTIFICACAO);
    await queryRunner.dropColumns("fila_impressao", ["dados_entrega", "numero_entrega"]);
    await queryRunner.query(`ALTER TABLE "fila_impressao" ALTER COLUMN "numero_comanda" SET NOT NULL`);
  }
}
