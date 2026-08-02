import "reflect-metadata";
import { AppDataSource } from "../../config/data-source";
import { HashService } from "../../modules/auth/services/hash.service";
import { Tenant } from "../../modules/tenants/entities/tenant.entity";
import { User, UserRole } from "../../modules/usuarios/entities/user.entity";

const TENANT_NOME_FANTASIA = "Lanchonete Teste";
const TENANT_CNPJ_CPF = "00000000000191";
const SENHA_PADRAO = "123456";

const USUARIOS_SEED: { nome: string; email: string; role: UserRole }[] = [
  { nome: "Administrador", email: "admin@pedmesa.com", role: UserRole.ADMIN },
  { nome: "Garçom Teste", email: "garcom@pedmesa.com", role: UserRole.GARCOM },
  { nome: "Cozinha Teste", email: "cozinha@pedmesa.com", role: UserRole.COZINHA },
  { nome: "Caixa Teste", email: "caixa@pedmesa.com", role: UserRole.CAIXA },
];

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

  for (const usuarioSeed of USUARIOS_SEED) {
    const existingUser = await userRepository.findOne({ where: { email: usuarioSeed.email } });

    if (!existingUser) {
      const senhaHash = await HashService.hash(SENHA_PADRAO);

      const usuario = await userRepository.save(
        userRepository.create({
          tenantId: tenant.id,
          nome: usuarioSeed.nome,
          email: usuarioSeed.email,
          senhaHash,
          role: usuarioSeed.role,
          ativo: true,
        })
      );
      console.log(`✅ Usuário ${usuario.role} criado: ${usuario.email} / senha: ${SENHA_PADRAO}`);
    } else {
      console.log(`ℹ️  Usuário "${usuarioSeed.email}" já existe.`);
    }
  }

  await AppDataSource.destroy();
}

run().catch((error) => {
  console.error("❌ Erro ao executar o seed:", error);
  process.exit(1);
});
