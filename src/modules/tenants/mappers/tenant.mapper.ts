import { Tenant, TenantStatus } from "../entities/tenant.entity";

export interface TenantResponse {
  id: string;
  nome_fantasia: string;
  cnpj_cpf: string;
  ativo: boolean;
  status: TenantStatus;
  plano_id: string | null;
  quantidade_comandas: number;
  razao_social: string | null;
  inscricao_estadual: string | null;
  ramo_atividade: string | null;
  nome_proprietario: string | null;
  cpf_proprietario: string | null;
  email_empresa: string | null;
  email_proprietario: string | null;
  usa_modulo_cozinha: boolean;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  token_agente: string | null;
  delivery_ativo: boolean;
  taxa_entrega_padrao: number | null;
  pedido_minimo_delivery: number;
  criado_em: Date;
}

export function toTenantResponse(tenant: Tenant): TenantResponse {
  return {
    id: tenant.id,
    nome_fantasia: tenant.nomeFantasia,
    cnpj_cpf: tenant.cnpjCpf,
    ativo: tenant.ativo,
    status: tenant.status,
    plano_id: tenant.planoId,
    quantidade_comandas: tenant.quantidadeComandas,
    razao_social: tenant.razaoSocial,
    inscricao_estadual: tenant.inscricaoEstadual,
    ramo_atividade: tenant.ramoAtividade,
    nome_proprietario: tenant.nomeProprietario,
    cpf_proprietario: tenant.cpfProprietario,
    email_empresa: tenant.emailEmpresa,
    email_proprietario: tenant.emailProprietario,
    usa_modulo_cozinha: tenant.usaModuloCozinha,
    logradouro: tenant.logradouro,
    numero: tenant.numero,
    bairro: tenant.bairro,
    cidade: tenant.cidade,
    estado: tenant.estado,
    cep: tenant.cep,
    token_agente: tenant.tokenAgente,
    delivery_ativo: tenant.deliveryAtivo,
    taxa_entrega_padrao: tenant.taxaEntregaPadrao,
    pedido_minimo_delivery: tenant.pedidoMinimoDelivery,
    criado_em: tenant.criadoEm,
  };
}
