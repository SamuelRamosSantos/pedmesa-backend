import { AppError } from "../../../shared/errors/app-error";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ESTADO_REGEX = /^[A-Za-z]{2}$/;

export interface UpdateTenantDto {
  nomeFantasia?: string;
  cnpjCpf?: string;
  razaoSocial?: string | null;
  inscricaoEstadual?: string | null;
  ramoAtividade?: string | null;
  nomeProprietario?: string | null;
  cpfProprietario?: string | null;
  emailEmpresa?: string | null;
  emailProprietario?: string | null;
  usaModuloCozinha?: boolean;
  quantidadeComandas?: number;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
}

function assertValidStringOpcional(valor: unknown, campo: string): string | null | undefined {
  if (valor === undefined) {
    return undefined;
  }

  if (valor === null) {
    return null;
  }

  if (typeof valor !== "string") {
    throw new AppError(`${campo} inválido.`, 400);
  }

  return valor.trim() || null;
}

function assertValidEmailOpcional(valor: unknown, campo: string): string | null | undefined {
  if (valor === undefined) {
    return undefined;
  }

  if (valor === null) {
    return null;
  }

  if (typeof valor !== "string" || !EMAIL_REGEX.test(valor)) {
    throw new AppError(`${campo} deve ser um e-mail válido.`, 400);
  }

  return valor;
}

export function assertValidUpdateTenantDto(body: unknown): UpdateTenantDto {
  const {
    nome_fantasia: nomeFantasia,
    cnpj_cpf: cnpjCpf,
    razao_social: razaoSocial,
    inscricao_estadual: inscricaoEstadual,
    ramo_atividade: ramoAtividade,
    nome_proprietario: nomeProprietario,
    cpf_proprietario: cpfProprietario,
    email_empresa: emailEmpresa,
    email_proprietario: emailProprietario,
    usa_modulo_cozinha: usaModuloCozinha,
    quantidade_comandas: quantidadeComandas,
    logradouro,
    numero,
    bairro,
    cidade,
    estado,
    cep,
  } = (body ?? {}) as Record<string, unknown>;

  const dto: UpdateTenantDto = {};

  if (nomeFantasia !== undefined) {
    if (typeof nomeFantasia !== "string" || nomeFantasia.trim().length === 0) {
      throw new AppError("nome_fantasia é obrigatório.", 400);
    }
    dto.nomeFantasia = nomeFantasia.trim();
  }

  if (cnpjCpf !== undefined) {
    if (typeof cnpjCpf !== "string" || cnpjCpf.trim().length === 0) {
      throw new AppError("cnpj_cpf é obrigatório.", 400);
    }
    dto.cnpjCpf = cnpjCpf.trim();
  }

  const razaoSocialValidado = assertValidStringOpcional(razaoSocial, "razao_social");
  if (razaoSocialValidado !== undefined) {
    dto.razaoSocial = razaoSocialValidado;
  }

  const inscricaoEstadualValidado = assertValidStringOpcional(inscricaoEstadual, "inscricao_estadual");
  if (inscricaoEstadualValidado !== undefined) {
    dto.inscricaoEstadual = inscricaoEstadualValidado;
  }

  const ramoAtividadeValidado = assertValidStringOpcional(ramoAtividade, "ramo_atividade");
  if (ramoAtividadeValidado !== undefined) {
    dto.ramoAtividade = ramoAtividadeValidado;
  }

  const nomeProprietarioValidado = assertValidStringOpcional(nomeProprietario, "nome_proprietario");
  if (nomeProprietarioValidado !== undefined) {
    dto.nomeProprietario = nomeProprietarioValidado;
  }

  const cpfProprietarioValidado = assertValidStringOpcional(cpfProprietario, "cpf_proprietario");
  if (cpfProprietarioValidado !== undefined) {
    dto.cpfProprietario = cpfProprietarioValidado;
  }

  const emailEmpresaValidado = assertValidEmailOpcional(emailEmpresa, "email_empresa");
  if (emailEmpresaValidado !== undefined) {
    dto.emailEmpresa = emailEmpresaValidado;
  }

  const emailProprietarioValidado = assertValidEmailOpcional(emailProprietario, "email_proprietario");
  if (emailProprietarioValidado !== undefined) {
    dto.emailProprietario = emailProprietarioValidado;
  }

  if (usaModuloCozinha !== undefined) {
    if (typeof usaModuloCozinha !== "boolean") {
      throw new AppError("usa_modulo_cozinha deve ser booleano.", 400);
    }
    dto.usaModuloCozinha = usaModuloCozinha;
  }

  if (quantidadeComandas !== undefined) {
    if (typeof quantidadeComandas !== "number" || !Number.isInteger(quantidadeComandas) || quantidadeComandas <= 0) {
      throw new AppError("quantidade_comandas deve ser um número inteiro maior que zero.", 400);
    }
    dto.quantidadeComandas = quantidadeComandas;
  }

  const logradouroValidado = assertValidStringOpcional(logradouro, "logradouro");
  if (logradouroValidado !== undefined) {
    dto.logradouro = logradouroValidado;
  }

  const numeroValidado = assertValidStringOpcional(numero, "numero");
  if (numeroValidado !== undefined) {
    dto.numero = numeroValidado;
  }

  const bairroValidado = assertValidStringOpcional(bairro, "bairro");
  if (bairroValidado !== undefined) {
    dto.bairro = bairroValidado;
  }

  const cidadeValidado = assertValidStringOpcional(cidade, "cidade");
  if (cidadeValidado !== undefined) {
    dto.cidade = cidadeValidado;
  }

  if (estado !== undefined) {
    if (estado !== null) {
      if (typeof estado !== "string" || !ESTADO_REGEX.test(estado.trim())) {
        throw new AppError("estado deve ser a sigla da UF (ex.: SP, PR).", 400);
      }
      dto.estado = estado.trim().toUpperCase();
    } else {
      dto.estado = null;
    }
  }

  const cepValidado = assertValidStringOpcional(cep, "cep");
  if (cepValidado !== undefined) {
    dto.cep = cepValidado;
  }

  if (Object.keys(dto).length === 0) {
    throw new AppError("Informe ao menos um campo para atualizar.", 400);
  }

  return dto;
}
