import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateComandasAndIntegrantesTables1700000000003 implements MigrationInterface {
  name = "CreateComandasAndIntegrantesTables1700000000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "comandas",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          {
            name: "tenant_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "numero_comanda",
            type: "int",
            isNullable: false,
          },
          {
            name: "status",
            type: "enum",
            enumName: "comandas_status_enum",
            enum: ["aberta", "fechada"],
            default: "'aberta'",
          },
          {
            name: "comanda_pai_id",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "aberta_em",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "fechada_em",
            type: "timestamp",
            isNullable: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      "comandas",
      new TableForeignKey({
        name: "fk_comandas_tenant_id",
        columnNames: ["tenant_id"],
        referencedTableName: "tenants",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "comandas",
      new TableForeignKey({
        name: "fk_comandas_comanda_pai_id",
        columnNames: ["comanda_pai_id"],
        referencedTableName: "comandas",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      })
    );

    // Garante, a nível de banco, que não existam duas comandas abertas com o mesmo
    // número dentro do mesmo tenant, fechando a janela de corrida entre a validação
    // da aplicação e a inserção concorrente.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "ux_comandas_tenant_numero_aberta" ON "comandas" ("tenant_id", "numero_comanda") WHERE "status" = 'aberta'`
    );

    await queryRunner.createTable(
      new Table({
        name: "integrantes_comanda",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          {
            name: "comanda_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "nome",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      "integrantes_comanda",
      new TableForeignKey({
        name: "fk_integrantes_comanda_comanda_id",
        columnNames: ["comanda_id"],
        referencedTableName: "comandas",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey("integrantes_comanda", "fk_integrantes_comanda_comanda_id");
    await queryRunner.dropTable("integrantes_comanda");

    await queryRunner.dropForeignKey("comandas", "fk_comandas_comanda_pai_id");
    await queryRunner.dropForeignKey("comandas", "fk_comandas_tenant_id");
    await queryRunner.dropTable("comandas");

    await queryRunner.query(`DROP TYPE IF EXISTS "comandas_status_enum"`);
  }
}
