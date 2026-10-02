import { AppDataSource } from "../../config/data-source";
import { assertValidCreateClienteDto } from "../../modules/clientes/dtos/create-cliente.dto";
import { assertValidCreateEnderecoClienteDto } from "../../modules/clientes/dtos/create-endereco-cliente.dto";
import { Cliente } from "../../modules/clientes/entities/cliente.entity";
import { EnderecoCliente } from "../../modules/clientes/entities/endereco-cliente.entity";
import { EnderecoClienteService } from "../../modules/clientes/services/endereco-cliente.service";
import { TaxaEntrega } from "../../modules/delivery/entities/taxa-entrega.entity";
import { normalizarLocalidade } from "../../modules/delivery/services/localidade-normalizer";
import { Tenant } from "../../modules/tenants/entities/tenant.entity";

// Dados de delivery para testes manuais no tenant do seed (PED-90).
// Idempotente: cada item é procurado pela sua chave natural antes de ser criado, e os
// dados passam pelos mesmos DTO validators da API (telefone, CEP e UF normalizados).

const CIDADE = "São Paulo";

const TAXAS_SEED: { bairro: string; valor: number; tempoEstimadoMin: number }[] = [
  { bairro: "Bela Vista", valor: 5, tempoEstimadoMin: 30 },
  { bairro: "Consolação", valor: 6, tempoEstimadoMin: 35 },
  { bairro: "Jardim Paulista", valor: 7.5, tempoEstimadoMin: 40 },
  { bairro: "Pinheiros", valor: 9, tempoEstimadoMin: 45 },
  { bairro: "Vila Mariana", valor: 10.5, tempoEstimadoMin: 50 },
];

const CLIENTES_SEED = [
  {
    cliente: { nome: "Maria Souza", telefone: "(11) 98765-4321", observacoes: "Prefere troco em notas pequenas" },
    endereco: {
      cep: "01310-100",
      logradouro: "Avenida Paulista",
      numero: "1000",
      complemento: "Apto 52",
      bairro: "Bela Vista",
      cidade: CIDADE,
      uf: "SP",
      referencia: "Próximo ao MASP",
    },
  },
  {
    cliente: { nome: "João Pereira", telefone: "(11) 91234-5678", observacoes: null },
    endereco: {
      cep: "05422-000",
      logradouro: "Rua dos Pinheiros",
      numero: "250",
      complemento: null,
      bairro: "Pinheiros",
      cidade: CIDADE,
      uf: "SP",
      referencia: "Portão verde",
    },
  },
  {
    cliente: { nome: "Ana Lima", telefone: "(11) 3456-7890", observacoes: "Interfone quebrado, ligar ao chegar" },
    endereco: {
      cep: "04101-000",
      logradouro: "Rua Domingos de Morais",
      numero: "1500",
      complemento: "Casa 2",
      bairro: "Vila Mariana",
      cidade: CIDADE,
      uf: "SP",
      referencia: null,
    },
  },
];

async function ativarDelivery(tenant: Tenant): Promise<void> {
  if (tenant.deliveryAtivo) {
    console.log("ℹ️  Delivery já está ativo no tenant.");
    return;
  }

  await AppDataSource.getRepository(Tenant).update({ id: tenant.id }, { deliveryAtivo: true });
  console.log("✅ Delivery ativado no tenant.");
}

async function criarTaxas(tenantId: string): Promise<void> {
  const repository = AppDataSource.getRepository(TaxaEntrega);

  for (const taxa of TAXAS_SEED) {
    const existente = await repository.findOneBy({
      tenantId,
      cidadeNormalizada: normalizarLocalidade(CIDADE),
      bairroNormalizado: normalizarLocalidade(taxa.bairro),
    });

    if (existente) {
      console.log(`ℹ️  Taxa de entrega para "${taxa.bairro}" já existe.`);
      continue;
    }

    // save() (e não insert) para os hooks da entidade preencherem as colunas normalizadas.
    await repository.save(repository.create({ tenantId, cidade: CIDADE, ...taxa }));
    console.log(`✅ Taxa de entrega criada: ${taxa.bairro} — R$ ${taxa.valor.toFixed(2)}`);
  }
}

async function criarClientesComEndereco(tenantId: string): Promise<void> {
  const clienteRepository = AppDataSource.getRepository(Cliente);
  const enderecoRepository = AppDataSource.getRepository(EnderecoCliente);

  for (const seed of CLIENTES_SEED) {
    const dto = assertValidCreateClienteDto(seed.cliente);
    let cliente = await clienteRepository.findOneBy({ tenantId, telefone: dto.telefone });

    if (cliente) {
      console.log(`ℹ️  Cliente "${dto.nome}" já existe.`);
    } else {
      cliente = await clienteRepository.save(clienteRepository.create({ tenantId, ...dto }));
      console.log(`✅ Cliente criado: ${dto.nome} (${dto.telefone})`);
    }

    const possuiEndereco = (await enderecoRepository.countBy({ tenantId, clienteId: cliente.id })) > 0;

    if (possuiEndereco) {
      continue;
    }

    await EnderecoClienteService.criar(tenantId, cliente.id, assertValidCreateEnderecoClienteDto(seed.endereco));
    console.log(`✅ Endereço principal criado para ${dto.nome}: ${seed.endereco.logradouro}, ${seed.endereco.numero}`);
  }
}

export async function seedDelivery(tenant: Tenant): Promise<void> {
  await ativarDelivery(tenant);
  await criarTaxas(tenant.id);
  await criarClientesComEndereco(tenant.id);
}
