import "reflect-metadata";
import { AppDataSource } from "../../config/data-source";
import { HashService } from "../../modules/auth/services/hash.service";
import { Tenant } from "../../modules/tenants/entities/tenant.entity";
import { User, UserRole } from "../../modules/usuarios/entities/user.entity";

const TENANT_NOME_FANTASIA = "Lanchonete Teste";
const TENANT_CNPJ_CPF = "00000000000191";
const ADMIN_EMAIL = "admin@pedmesa.com";
const ADMIN_SENHA = "123456";

async function run(): Promise<void> {
  await AppDataSource.initialize();

  const tenantRepository = AppDataSource.getRepository(Tenant);
  const userRepository = AppDataSource.getRepository(User);

  let tenant = await tenantRepository.findOne({ where: { cnpjCpf: TENANT_CNPJ_CPF } });

  if (!tenant) {
    tenant = await tenantRepository.save(
      tenantRepository.create({
        nomeFantasia: TENANT_NOME_FANTASIA,
        cnpjCpf: TENANT_CNPJ_CPF,
        ativo: true,
      })
    );
    console.log(`✅ Tenant "${TENANT_NOME_FANTASIA}" criado (${tenant.id}).`);
  } else {
    console.log(`ℹ️  Tenant "${TENANT_NOME_FANTASIA}" já existe (${tenant.id}).`);
  }

  const existingAdmin = await userRepository.findOne({ where: { email: ADMIN_EMAIL } });

  if (!existingAdmin) {
    const senhaHash = await HashService.hash(ADMIN_SENHA);

    const admin = await userRepository.save(
      userRepository.create({
        tenantId: tenant.id,
        nome: "Administrador",
        email: ADMIN_EMAIL,
        senhaHash,
        role: UserRole.ADMIN,
        ativo: true,
      })
    );
    console.log(`✅ Usuário admin criado: ${admin.email} / senha: ${ADMIN_SENHA}`);
  } else {
    console.log(`ℹ️  Usuário admin "${ADMIN_EMAIL}" já existe.`);
  }

  await AppDataSource.destroy();
}

run().catch((error) => {
  console.error("❌ Erro ao executar o seed:", error);
  process.exit(1);
});
