import { randomInt, randomUUID } from "node:crypto";
import { AppDataSource } from "../../src/config/data-source";
import { HashService } from "../../src/modules/auth/services/hash.service";
import {
  Tenant,
  TenantStatus,
} from "../../src/modules/tenants/entities/tenant.entity";
import {
  User,
  UserRole,
} from "../../src/modules/usuarios/entities/user.entity";
import { TENANT_COOKIE_NAME } from "../../src/shared/utils/auth-cookies";
import { criarCliente } from "./client";

// Dados sempre únicos (randomUUID): nenhum teste depende do estado deixado por outro.

export const SENHA_PADRAO = "senha-de-teste-123";

function sufixoUnico(): string {
  return randomUUID().slice(0, 8);
}

export async function criarTenant(
  dados: Partial<
    Pick<Tenant, "nomeFantasia" | "status" | "quantidadeComandas">
  > = {},
): Promise<Tenant> {
  const repositorio = AppDataSource.getRepository(Tenant);

  return repositorio.save(
    repositorio.create({
      nomeFantasia: dados.nomeFantasia ?? `Tenant de teste ${sufixoUnico()}`,
      cnpjCpf: Array.from({ length: 14 }, () => randomInt(10)).join(""),
      status: dados.status ?? TenantStatus.ATIVO,
      quantidadeComandas: dados.quantidadeComandas ?? 20,
    }),
  );
}

export async function criarUsuario(
  tenant: Tenant,
  roles: UserRole[] = [UserRole.ADMIN],
): Promise<User> {
  const repositorio = AppDataSource.getRepository(User);

  return repositorio.save(
    repositorio.create({
      tenantId: tenant.id,
      nome: `Usuário de teste ${sufixoUnico()}`,
      email: `teste-${randomUUID()}@pedmesa.test`,
      senhaHash: await HashService.hash(SENHA_PADRAO),
      roles,
    }),
  );
}

/**
 * Faz login pela API e devolve um cliente já autenticado: a sessão vem no cookie
 * HttpOnly `pedmesa_token` (PED-76), que o `agent` guarda e reenvia sozinho.
 */
export async function autenticar(usuario: User) {
  const cliente = criarCliente();

  const resposta = await cliente
    .post("/api/v1/auth/login")
    .send({ email: usuario.email, senha: SENHA_PADRAO })
    .expect(200);

  const cookies = resposta.headers["set-cookie"];
  const recebeuSessao =
    Array.isArray(cookies) &&
    cookies.some((cookie) => cookie.startsWith(`${TENANT_COOKIE_NAME}=`));

  if (!recebeuSessao) {
    throw new Error("O login de teste não devolveu o cookie de sessão.");
  }

  return cliente;
}
