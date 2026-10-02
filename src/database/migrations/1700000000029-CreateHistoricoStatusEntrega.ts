import { MigrationInterface, QueryRunner, Table, TableCheck, TableForeignKey, TableIndex, TableUnique } from "typeorm";

// PED-89: trilha append-only das transições de status da entrega.
//
// - tenant_id com FK composta (entrega_id, tenant_id) → entregas(id, tenant_id), como nas
//   demais tabelas do delivery. Para isso, entregas ganha UNIQUE (id, tenant_id).
// - status_anterior / status_novo reusam entregas_status_enum.
// - Append-only reforçado no banco: o trigger recusa UPDATE e DELETE direto. DELETE em
//   cascata (vindo de entregas, comandas ou tenants) é permitido: nesse caso a linha é
//   apagada por um trigger de integridade referencial, e pg_trigger_depth() já é > 1
//   quando este trigger roda.
const UNIQUE_ENTREGAS_ID_TENANT = "ux_entregas_id_tenant";
const FUNCAO_APPEND_ONLY = "fn_historico_status_entrega_append_only";
const TRIGGER_APPEND_ONLY = "tg_historico_status_entrega_append_only";

export class CreateHistoricoStatusEntrega1700000000029 implements MigrationInterface {
  name = "CreateHistoricoStatusEntrega1700000000029";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createUniqueConstraint(
      "entregas",
      new TableUnique({ name: UNIQUE_ENTREGAS_ID_TENANT, columnNames: ["id", "tenant_id"] })
    );

    await queryRunner.createTable(
      new Table({
        name: "historico_status_entrega",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, default: "uuid_generate_v4()" },
          { name: "tenant_id", type: "uuid", isNullable: false },
          { name: "entrega_id", type: "uuid", isNullable: false },
          {
            name: "status_anterior",
            type: "enum",
            enumName: "entregas_status_enum",
            enum: ["em_producao", "pronto_para_envio", "em_rota", "entregue", "cancelado"],
            isNullable: true,
          },
          {
            name: "status_novo",
            type: "enum",
            enumName: "entregas_status_enum",
            enum: ["em_producao", "pronto_para_envio", "em_rota", "entregue", "cancelado"],
            isNullable: false,
          },
          { name: "usuario_id", type: "uuid", isNullable: true },
          { name: "motivo", type: "varchar", length: "255", isNullable: true },
          { name: "criado_em", type: "timestamp", default: "now()" },
        ],
        checks: [
          new TableCheck({
            name: "ck_historico_status_entrega_status_muda",
            expression: `"status_anterior" IS DISTINCT FROM "status_novo"`,
          }),
        ],
      }),
      true
    );

    await queryRunner.createForeignKeys("historico_status_entrega", [
      new TableForeignKey({
        name: "fk_historico_status_entrega_entrega_tenant",
        columnNames: ["entrega_id", "tenant_id"],
        referencedTableName: "entregas",
        referencedColumnNames: ["id", "tenant_id"],
        onDelete: "CASCADE",
      }),
      new TableForeignKey({
        name: "fk_historico_status_entrega_usuario_id",
        columnNames: ["usuario_id"],
        referencedTableName: "usuarios",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      }),
    ]);

    await queryRunner.createIndex(
      "historico_status_entrega",
      new TableIndex({ name: "ix_historico_status_entrega_entrega_criado", columnNames: ["entrega_id", "criado_em"] })
    );

    await queryRunner.query(`
      CREATE FUNCTION "${FUNCAO_APPEND_ONLY}"() RETURNS trigger AS $$
      BEGIN
        IF TG_OP = 'DELETE' AND pg_trigger_depth() > 1 THEN
          RETURN OLD;
        END IF;
        RAISE EXCEPTION 'historico_status_entrega é append-only: % não é permitido', TG_OP
          USING ERRCODE = 'restrict_violation';
      END;
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(`
      CREATE TRIGGER "${TRIGGER_APPEND_ONLY}"
      BEFORE UPDATE OR DELETE ON "historico_status_entrega"
      FOR EACH ROW EXECUTE FUNCTION "${FUNCAO_APPEND_ONLY}"()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // SQL direto: o dropTable do TypeORM pode tentar remover entregas_status_enum, que
    // continua em uso pela tabela entregas.
    await queryRunner.query(`DROP TABLE "historico_status_entrega"`);
    await queryRunner.query(`DROP FUNCTION "${FUNCAO_APPEND_ONLY}"()`);
    await queryRunner.dropUniqueConstraint("entregas", UNIQUE_ENTREGAS_ID_TENANT);
  }
}
