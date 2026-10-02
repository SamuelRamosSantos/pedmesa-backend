import { MigrationInterface, QueryRunner, TableCheck, TableColumn } from "typeorm";

// ADR-001 (PED-83/PED-84): o delivery é uma comanda com tipo_atendimento = 'delivery'.
// Só delivery pode ficar sem numero_comanda; o CHECK garante isso no banco.
//
// O índice parcial ux_comandas_tenant_numero_aberta (tenant_id, numero_comanda)
// WHERE status = 'aberta' continua valendo para mesa: no Postgres, NULLs são
// distintos entre si num índice único, então várias comandas delivery abertas
// (numero_comanda NULL) não colidem.
const CHECK_NUMERO_OBRIGATORIO_PARA_MESA = "ck_comandas_numero_obrigatorio_para_mesa";

export class AddTipoAtendimentoToComandas1700000000024 implements MigrationInterface {
  name = "AddTipoAtendimentoToComandas1700000000024";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // DEFAULT 'mesa' preenche as linhas existentes na própria criação da coluna.
    await queryRunner.addColumn(
      "comandas",
      new TableColumn({
        name: "tipo_atendimento",
        type: "enum",
        enumName: "comandas_tipo_atendimento_enum",
        enum: ["mesa", "delivery"],
        default: "'mesa'",
        isNullable: false,
      })
    );

    // SQL direto em vez de changeColumn: no Postgres o changeColumn do TypeORM recria a
    // coluna quando considera o tipo diferente ("int" x "integer"), o que apagaria os
    // números das mesas existentes. Aqui só a restrição NOT NULL muda.
    await queryRunner.query(`ALTER TABLE "comandas" ALTER COLUMN "numero_comanda" DROP NOT NULL`);

    await queryRunner.createCheckConstraint(
      "comandas",
      new TableCheck({
        name: CHECK_NUMERO_OBRIGATORIO_PARA_MESA,
        expression: `"tipo_atendimento" = 'delivery' OR "numero_comanda" IS NOT NULL`,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const [{ total }] = await queryRunner.query(
      `SELECT COUNT(*)::int AS total FROM "comandas" WHERE "tipo_atendimento" = 'delivery'`
    );

    if (total > 0) {
      throw new Error(
        `Não é possível reverter AddTipoAtendimentoToComandas: existem ${total} comanda(s) de delivery. ` +
          "Reverter exigiria apagar esses dados ou inventar números de mesa. Remova ou migre as comandas de delivery manualmente antes."
      );
    }

    await queryRunner.dropCheckConstraint("comandas", CHECK_NUMERO_OBRIGATORIO_PARA_MESA);

    await queryRunner.query(`ALTER TABLE "comandas" ALTER COLUMN "numero_comanda" SET NOT NULL`);

    await queryRunner.dropColumn("comandas", "tipo_atendimento");
    await queryRunner.query(`DROP TYPE IF EXISTS "comandas_tipo_atendimento_enum"`);
  }
}
