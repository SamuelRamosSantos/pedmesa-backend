import { MigrationInterface, QueryRunner, Table, TableCheck, TableForeignKey, TableIndex, TableUnique } from "typeorm";

// PED-88: núcleo do delivery (ADR-001).
//
// entregas
// - 1:1 com a comanda (UNIQUE comanda_id), endereço e taxa copiados no momento do pedido.
// - FKs compostas com tenant_id: o banco impede uma entrega cuja comanda ou cliente
//   seja de outro tenant. Para isso, comandas ganha UNIQUE (id, tenant_id); a de
//   clientes já existe (ux_clientes_id_tenant, migration 026).
// - forma_pagamento_prevista reusa o tipo pagamentos_comanda_forma_enum.
//
// sequencias_entrega
// - Um contador por (tenant_id, data). O próximo número sai de um único
//   INSERT … ON CONFLICT DO UPDATE … RETURNING (ver numeracao-entrega.ts).
const UNIQUE_COMANDAS_ID_TENANT = "ux_comandas_id_tenant";

export class CreateEntregasAndSequenciasEntrega1700000000028 implements MigrationInterface {
  name = "CreateEntregasAndSequenciasEntrega1700000000028";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createUniqueConstraint(
      "comandas",
      new TableUnique({ name: UNIQUE_COMANDAS_ID_TENANT, columnNames: ["id", "tenant_id"] })
    );

    await queryRunner.createTable(
      new Table({
        name: "entregas",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, default: "uuid_generate_v4()" },
          { name: "tenant_id", type: "uuid", isNullable: false },
          { name: "comanda_id", type: "uuid", isNullable: false },
          { name: "cliente_id", type: "uuid", isNullable: false },
          { name: "data_numeracao", type: "date", isNullable: false },
          { name: "numero_entrega", type: "int", isNullable: false },
          { name: "endereco_cep", type: "char", length: "8", isNullable: false },
          { name: "endereco_logradouro", type: "varchar", length: "255", isNullable: false },
          { name: "endereco_numero", type: "varchar", length: "20", isNullable: false },
          { name: "endereco_complemento", type: "varchar", length: "100", isNullable: true },
          { name: "endereco_bairro", type: "varchar", length: "120", isNullable: false },
          { name: "endereco_cidade", type: "varchar", length: "120", isNullable: false },
          { name: "endereco_uf", type: "char", length: "2", isNullable: false },
          { name: "endereco_referencia", type: "varchar", length: "255", isNullable: true },
          { name: "taxa_entrega", type: "decimal", precision: 10, scale: 2, isNullable: false },
          {
            name: "forma_pagamento_prevista",
            type: "enum",
            enumName: "pagamentos_comanda_forma_enum",
            enum: ["pix", "dinheiro", "cartao_credito", "cartao_debito"],
            isNullable: false,
          },
          { name: "troco_para", type: "decimal", precision: 10, scale: 2, isNullable: true },
          {
            name: "status_entrega",
            type: "enum",
            enumName: "entregas_status_enum",
            enum: ["em_producao", "pronto_para_envio", "em_rota", "entregue", "cancelado"],
            default: "'em_producao'",
            isNullable: false,
          },
          { name: "versao", type: "int", default: 1, isNullable: false },
          { name: "previsao_entrega_em", type: "timestamp", isNullable: true },
          { name: "saiu_em", type: "timestamp", isNullable: true },
          { name: "entregue_em", type: "timestamp", isNullable: true },
          { name: "motivo_cancelamento", type: "varchar", length: "255", isNullable: true },
          { name: "criado_em", type: "timestamp", default: "now()" },
        ],
        uniques: [
          new TableUnique({ name: "ux_entregas_comanda_id", columnNames: ["comanda_id"] }),
          new TableUnique({
            name: "ux_entregas_tenant_dia_numero",
            columnNames: ["tenant_id", "data_numeracao", "numero_entrega"],
          }),
        ],
        checks: [
          new TableCheck({
            name: "ck_entregas_troco_so_em_dinheiro",
            expression: `"troco_para" IS NULL OR "forma_pagamento_prevista" = 'dinheiro'`,
          }),
          new TableCheck({ name: "ck_entregas_troco_para_positivo", expression: `"troco_para" IS NULL OR "troco_para" > 0` }),
          new TableCheck({ name: "ck_entregas_taxa_nao_negativa", expression: `"taxa_entrega" >= 0` }),
          new TableCheck({ name: "ck_entregas_numero_positivo", expression: `"numero_entrega" > 0` }),
          new TableCheck({
            name: "ck_entregas_cancelamento_com_motivo",
            expression: `"status_entrega" <> 'cancelado' OR "motivo_cancelamento" IS NOT NULL`,
          }),
        ],
      }),
      true
    );

    await queryRunner.createForeignKeys("entregas", [
      new TableForeignKey({
        name: "fk_entregas_comanda_tenant",
        columnNames: ["comanda_id", "tenant_id"],
        referencedTableName: "comandas",
        referencedColumnNames: ["id", "tenant_id"],
        onDelete: "CASCADE",
      }),
      new TableForeignKey({
        name: "fk_entregas_cliente_tenant",
        columnNames: ["cliente_id", "tenant_id"],
        referencedTableName: "clientes",
        referencedColumnNames: ["id", "tenant_id"],
        onDelete: "RESTRICT",
      }),
    ]);

    await queryRunner.createIndices("entregas", [
      // Painel de expedição: entregas do tenant por status, em ordem de chegada.
      new TableIndex({ name: "ix_entregas_tenant_status_criado", columnNames: ["tenant_id", "status_entrega", "criado_em"] }),
      // Histórico de pedidos de um cliente; também evita varredura no RESTRICT ao excluir cliente.
      new TableIndex({ name: "ix_entregas_cliente_id", columnNames: ["cliente_id"] }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: "sequencias_entrega",
        columns: [
          { name: "tenant_id", type: "uuid", isPrimary: true },
          { name: "data", type: "date", isPrimary: true },
          { name: "ultimo_numero", type: "int", isNullable: false },
        ],
        checks: [new TableCheck({ name: "ck_sequencias_entrega_numero_positivo", expression: `"ultimo_numero" > 0` })],
        foreignKeys: [
          new TableForeignKey({
            name: "fk_sequencias_entrega_tenant_id",
            columnNames: ["tenant_id"],
            referencedTableName: "tenants",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE",
          }),
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // SQL direto: o dropTable do TypeORM pode tentar remover os tipos enum das colunas,
    // e pagamentos_comanda_forma_enum continua em uso por pagamentos_comanda.
    await queryRunner.query(`DROP TABLE "sequencias_entrega"`);
    await queryRunner.query(`DROP TABLE "entregas"`);
    await queryRunner.query(`DROP TYPE "entregas_status_enum"`);
    await queryRunner.dropUniqueConstraint("comandas", UNIQUE_COMANDAS_ID_TENANT);
  }
}
