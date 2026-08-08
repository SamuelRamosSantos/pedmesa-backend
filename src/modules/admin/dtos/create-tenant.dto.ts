import { AppError } from "../../../shared/errors/app-error";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENHA_MIN_LENGTH = 6;

export interface CreateTenantDto {
  nomeFantasia: string;
  cnpjCpf: string;
  adminNome: string;
  adminEmail: string;
  adminSenha: string;
}

export function assertValidCreateTenantDto(body: unknown): CreateTenantDto {
  const {
    nome_fantasia: nomeFantasia,
    cnpj_cpf: cnpjCpf,
    admin_nome: adminNome,
    admin_email: adminEmail,
    admin_senha: adminSenha,
  } = (body ?? {}) as Record<string, unknown>;

  if (typeof nomeFantasia !== "string" || nomeFantasia.trim().length === 0) {
    throw new AppError("Nome fantasia é obrigatório.", 400);
  }

  if (typeof cnpjCpf !== "string" || cnpjCpf.trim().length === 0) {
    throw new AppError("CNPJ/CPF é obrigatório.", 400);
  }

  if (typeof adminNome !== "string" || adminNome.trim().length === 0) {
    throw new AppError("Nome do administrador é obrigatório.", 400);
  }

  if (typeof adminEmail !== "string" || !EMAIL_REGEX.test(adminEmail)) {
    throw new AppError("E-mail do administrador inválido.", 400);
  }

  if (typeof adminSenha !== "string" || adminSenha.length < SENHA_MIN_LENGTH) {
    throw new AppError(`Senha do administrador deve ter ao menos ${SENHA_MIN_LENGTH} caracteres.`, 400);
  }

  return {
    nomeFantasia: nomeFantasia.trim(),
    cnpjCpf: cnpjCpf.trim(),
    adminNome: adminNome.trim(),
    adminEmail: adminEmail.trim().toLowerCase(),
    adminSenha,
  };
}
