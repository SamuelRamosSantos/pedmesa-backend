import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddPodeConcederDescontoToUsuarios1700000000010 implements MigrationInterface {
  name = "AddPodeConcederDescontoToUsuarios1700000000010";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "usuarios",
      new TableColumn({
        name: "pode_conceder_desconto",
        type: "boolean",
        default: false,
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("usuarios", "pode_conceder_desconto");
  }
}
