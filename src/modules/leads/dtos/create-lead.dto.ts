import { AppError } from "../../../shared/errors/app-error";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface CreateLeadDto {
  nome: string;
  email: string;
  whatsapp: string;
  nomeEstabelecimento: string;
  cpfCnpj: string;
}

function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function assertValidCreateLeadDto(body: unknown): CreateLeadDto {
  const {
    nome,
    email,
    whatsapp,
    nome_estabelecimento: nomeEstabelecimento,
    cpf_cnpj: cpfCnpj,
  } = (body ?? {}) as Record<string, unknown>;

  if (typeof nome !== "string" || nome.trim().length === 0) {
    throw new AppError("Nome é obrigatório.", 400);
  }

  if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    throw new AppError("E-mail inválido.", 400);
  }

  if (typeof whatsapp !== "string" || apenasDigitos(whatsapp).length < 10 || apenasDigitos(whatsapp).length > 11) {
    throw new AppError("WhatsApp inválido — informe DDD + número.", 400);
  }

  if (typeof nomeEstabelecimento !== "string" || nomeEstabelecimento.trim().length === 0) {
    throw new AppError("Nome do estabelecimento é obrigatório.", 400);
  }

  if (typeof cpfCnpj !== "string" || ![11, 14].includes(apenasDigitos(cpfCnpj).length)) {
    throw new AppError("CPF/CNPJ inválido.", 400);
  }

  return {
    nome: nome.trim(),
    email: email.trim().toLowerCase(),
    whatsapp: apenasDigitos(whatsapp),
    nomeEstabelecimento: nomeEstabelecimento.trim(),
    cpfCnpj: apenasDigitos(cpfCnpj),
  };
}
