import "reflect-metadata";
import { AppDataSource } from "../../config/data-source";
import { HashService } from "../../modules/auth/services/hash.service";
import { SuperAdmin } from "../../modules/admin/entities/super-admin.entity";

const NOME = "Super Admin";
const EMAIL = process.env.SUPER_ADMIN_EMAIL ?? "superadmin@pedmesa.com";
const SENHA = process.env.SUPER_ADMIN_SENHA ?? "123456";

async function run(): Promise<void> {
  await AppDataSource.initialize();

  const repository = AppDataSource.getRepository(SuperAdmin);
  const existente = await repository.findOne({ where: { email: EMAIL } });

  if (existente) {
    console.log(`ℹ️  Super-admin "${EMAIL}" já existe (${existente.id}).`);
  } else {
    const senhaHash = await HashService.hash(SENHA);

    const superAdmin = await repository.save(
      repository.create({
        nome: NOME,
        email: EMAIL,
        senhaHash,
        ativo: true,
      })
    );

    console.log(`✅ Super-admin criado: ${superAdmin.email} / senha: ${SENHA}`);
  }

  await AppDataSource.destroy();
}

run().catch((error) => {
  console.error("❌ Erro ao executar o seed de super-admin:", error);
  process.exit(1);
});
