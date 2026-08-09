import { Lead } from "../entities/lead.entity";

export interface LeadResponse {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  nome_estabelecimento: string;
  cpf_cnpj: string;
  criado_em: Date;
}

export function toLeadResponse(lead: Lead): LeadResponse {
  return {
    id: lead.id,
    nome: lead.nome,
    email: lead.email,
    whatsapp: lead.whatsapp,
    nome_estabelecimento: lead.nomeEstabelecimento,
    cpf_cnpj: lead.cpfCnpj,
    criado_em: lead.criadoEm,
  };
}
