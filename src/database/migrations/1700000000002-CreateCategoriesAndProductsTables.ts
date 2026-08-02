import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from "typeorm";

export class CreateCategoriesAndProductsTables1700000000002 implements MigrationInterface {
  name = "CreateCategoriesAndProductsTables1700000000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "categorias",
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
            name: "nome",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "ordem_exibicao",
            type: "int",
            default: 0,
          },
          {
            name: "ativo",
            type: "boolean",
            default: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      "categorias",
      new TableForeignKey({
        name: "fk_categorias_tenant_id",
        columnNames: ["tenant_id"],
        referencedTableName: "tenants",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createTable(
      new Table({
        name: "produtos",
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
            name: "categoria_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "nome",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "preco",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: "descricao",
            type: "text",
            isNullable: true,
          },
          {
            name: "disponivel",
            type: "boolean",
            default: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      "produtos",
      new TableForeignKey({
        name: "fk_produtos_tenant_id",
        columnNames: ["tenant_id"],
        referencedTableName: "tenants",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "produtos",
      new TableForeignKey({
        name: "fk_produtos_categoria_id",
        columnNames: ["categoria_id"],
        referencedTableName: "categorias",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      })
    );

    await queryRunner.addColumn(
      "tenants",
      new TableColumn({
        name: "quantidade_comandas",
        type: "int",
        default: 20,
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("tenants", "quantidade_comandas");

    await queryRunner.dropForeignKey("produtos", "fk_produtos_categoria_id");
    await queryRunner.dropForeignKey("produtos", "fk_produtos_tenant_id");
    await queryRunner.dropTable("produtos");

    await queryRunner.dropForeignKey("categorias", "fk_categorias_tenant_id");
    await queryRunner.dropTable("categorias");
  }
}
