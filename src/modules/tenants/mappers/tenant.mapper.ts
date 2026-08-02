import { Tenant } from "../entities/tenant.entity";

export interface TenantResponse {
  id: string;
  nome_fantasia: string;
  cnpj_cpf: string;
  ativo: boolean;
  quantidade_comandas: number;
  criado_em: Date;
}

export function toTenantResponse(tenant: Tenant): TenantResponse {
  return {
    id: tenant.id,
    nome_fantasia: tenant.nomeFantasia,
    cnpj_cpf: tenant.cnpjCpf,
    ativo: tenant.ativo,
    quantidade_comandas: tenant.quantidadeComandas,
    criado_em: tenant.criadoEm,
  };
}
