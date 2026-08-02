import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreatePedidosAndItensPedidoTables1700000000004 implements MigrationInterface {
  name = "CreatePedidosAndItensPedidoTables1700000000004";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "pedidos",
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
            name: "usuario_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "status_preparo",
            type: "enum",
            enumName: "pedidos_status_preparo_enum",
            enum: ["pendente", "em_preparo", "pronto", "entregue"],
            default: "'pendente'",
          },
          {
            name: "criado_em",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      "pedidos",
      new TableForeignKey({
        name: "fk_pedidos_comanda_id",
        columnNames: ["comanda_id"],
        referencedTableName: "comandas",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "pedidos",
      new TableForeignKey({
        name: "fk_pedidos_usuario_id",
        columnNames: ["usuario_id"],
        referencedTableName: "usuarios",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      })
    );

    await queryRunner.createTable(
      new Table({
        name: "itens_pedido",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          {
            name: "pedido_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "produto_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "integrante_id",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "quantidade",
            type: "int",
            isNullable: false,
          },
          {
            name: "preco_unitario",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: "observacao",
            type: "text",
            isNullable: true,
          },
          {
            name: "status_item",
            type: "enum",
            enumName: "itens_pedido_status_item_enum",
            enum: ["pendente", "em_preparo", "pronto", "entregue"],
            default: "'pendente'",
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      "itens_pedido",
      new TableForeignKey({
        name: "fk_itens_pedido_pedido_id",
        columnNames: ["pedido_id"],
        referencedTableName: "pedidos",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "itens_pedido",
      new TableForeignKey({
        name: "fk_itens_pedido_produto_id",
        columnNames: ["produto_id"],
        referencedTableName: "produtos",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      })
    );

    await queryRunner.createForeignKey(
      "itens_pedido",
      new TableForeignKey({
        name: "fk_itens_pedido_integrante_id",
        columnNames: ["integrante_id"],
        referencedTableName: "integrantes_comanda",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey("itens_pedido", "fk_itens_pedido_integrante_id");
    await queryRunner.dropForeignKey("itens_pedido", "fk_itens_pedido_produto_id");
    await queryRunner.dropForeignKey("itens_pedido", "fk_itens_pedido_pedido_id");
    await queryRunner.dropTable("itens_pedido");
    await queryRunner.query(`DROP TYPE IF EXISTS "itens_pedido_status_item_enum"`);

    await queryRunner.dropForeignKey("pedidos", "fk_pedidos_usuario_id");
    await queryRunner.dropForeignKey("pedidos", "fk_pedidos_comanda_id");
    await queryRunner.dropTable("pedidos");
    await queryRunner.query(`DROP TYPE IF EXISTS "pedidos_status_preparo_enum"`);
  }
}
