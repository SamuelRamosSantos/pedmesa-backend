import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

// PED-126: o atendente com permissão de desconto pode isentar a taxa de entrega. A taxa
// gravada fica 0 e esta coluna registra que foi isenção (e não bairro com taxa grátis),
// para o painel, o cupom e os relatórios distinguirem os dois casos.
export class AddTaxaIsentaToEntregas1700000000033
  implements MigrationInterface
{
  name = "AddTaxaIsentaToEntregas1700000000033";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "entregas",
      new TableColumn({
        name: "taxa_isenta",
        type: "boolean",
        isNullable: false,
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("entregas", "taxa_isenta");
  }
}
