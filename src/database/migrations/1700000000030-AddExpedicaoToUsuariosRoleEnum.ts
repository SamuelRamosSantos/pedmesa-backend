import { MigrationInterface, QueryRunner } from "typeorm";

// PED-113: papel EXPEDICAO (decisão do PO no ADR-001): cria pedidos delivery e opera o
// painel de expedição.
//
// ALTER TYPE … ADD VALUE roda dentro da transação das migrations (modo padrão "all" do
// projeto): desde o Postgres 12 isso é aceito, desde que o valor novo não seja USADO na
// mesma transação. Esta migration não usa o valor.
//
// Não há `transaction = false` aqui: o TypeORM recusa uma migration que sobrescreve o modo
// de transação quando o modo global é "all" (ForbiddenTransactionModeOverrideError).
// Atenção: não crie outra migration que grave 'expedicao' e possa rodar na mesma execução
// desta; ela falharia com "unsafe use of new value".
export class AddExpedicaoToUsuariosRoleEnum1700000000030 implements MigrationInterface {
  name = "AddExpedicaoToUsuariosRoleEnum1700000000030";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "usuarios_role_enum" ADD VALUE IF NOT EXISTS 'expedicao'`);
  }

  // O Postgres não remove um valor de enum (não existe ALTER TYPE … DROP VALUE). Reverter
  // aqui só garante que ninguém use o papel: o valor 'expedicao' continua no tipo, sem
  // efeito para o código anterior, que nunca o grava.
  public async down(queryRunner: QueryRunner): Promise<void> {
    const [{ total }] = await queryRunner.query(
      `SELECT COUNT(*)::int AS total FROM "usuarios" WHERE 'expedicao' = ANY("roles")`
    );

    if (total > 0) {
      throw new Error(
        `Não é possível reverter AddExpedicaoToUsuariosRoleEnum: ${total} usuário(s) têm o papel "expedicao". ` +
          "Remova esse papel desses usuários antes. O valor continua no enum usuarios_role_enum, porque o Postgres não remove valores de enum."
      );
    }
  }
}
