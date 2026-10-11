import { EntityManager } from "typeorm";
import { AppDataSource } from "../../../config/data-source";
import { AppError } from "../../../shared/errors/app-error";
import { CreateEnderecoClienteDto } from "../dtos/create-endereco-cliente.dto";
import { UpdateEnderecoClienteDto } from "../dtos/update-endereco-cliente.dto";
import { Cliente } from "../entities/cliente.entity";
import { EnderecoCliente } from "../entities/endereco-cliente.entity";
import { deveSerPrincipal, proximoPrincipalAposRemocao } from "./endereco-principal";

// Trava a linha do cliente até o fim da transação: operações simultâneas sobre os
// endereços do mesmo cliente (troca de principal, exclusão) passam a rodar em fila, em
// vez de uma delas esbarrar no índice único parcial de principal.
async function travarCliente(manager: EntityManager, tenantId: string, clienteId: string): Promise<Cliente> {
  const cliente = await manager
    .createQueryBuilder(Cliente, "cliente")
    .setLock("pessimistic_write")
    .where("cliente.id = :clienteId", { clienteId })
    .andWhere("cliente.tenantId = :tenantId", { tenantId })
    .getOne();

  if (!cliente) {
    throw new AppError("Cliente não encontrado.", 404);
  }

  return cliente;
}

async function buscarEnderecoDoCliente(
  manager: EntityManager,
  cliente: Cliente,
  enderecoId: string
): Promise<EnderecoCliente> {
  const endereco = await manager.findOneBy(EnderecoCliente, {
    id: enderecoId,
    clienteId: cliente.id,
    tenantId: cliente.tenantId,
  });

  if (!endereco) {
    throw new AppError("Endereço não encontrado.", 404);
  }

  return endereco;
}

async function desmarcarPrincipalAtual(manager: EntityManager, cliente: Cliente): Promise<void> {
  await manager.update(
    EnderecoCliente,
    { clienteId: cliente.id, tenantId: cliente.tenantId, principal: true },
    { principal: false }
  );
}

// Desmarcar antes de marcar: o índice único parcial não admite dois principais nem por
// um instante dentro da transação.
async function marcarComoPrincipal(manager: EntityManager, cliente: Cliente, endereco: EnderecoCliente): Promise<void> {
  if (endereco.principal) {
    return;
  }

  await desmarcarPrincipalAtual(manager, cliente);
  endereco.principal = true;
}

export class EnderecoClienteService {
  // Principal primeiro, depois do mais recente para o mais antigo: a ordem em que o
  // formulário do delivery mostra as opções.
  static async listar(tenantId: string, clienteId: string): Promise<EnderecoCliente[]> {
    return AppDataSource.getRepository(EnderecoCliente).find({
      where: { tenantId, clienteId },
      order: { principal: "DESC", criadoEm: "DESC" },
    });
  }

  static async criar(tenantId: string, clienteId: string, dto: CreateEnderecoClienteDto): Promise<EnderecoCliente> {
    return AppDataSource.transaction(async (manager) => {
      const cliente = await travarCliente(manager, tenantId, clienteId);
      const quantidadeExistente = await manager.countBy(EnderecoCliente, { clienteId: cliente.id, tenantId });
      const principal = deveSerPrincipal(dto.principal, quantidadeExistente);

      if (principal) {
        await desmarcarPrincipalAtual(manager, cliente);
      }

      return manager.save(
        manager.create(EnderecoCliente, {
          ...dto,
          principal,
          clienteId: cliente.id,
          tenantId: cliente.tenantId,
        })
      );
    });
  }

  static async definirPrincipal(tenantId: string, clienteId: string, enderecoId: string): Promise<EnderecoCliente> {
    return AppDataSource.transaction(async (manager) => {
      const cliente = await travarCliente(manager, tenantId, clienteId);
      const endereco = await buscarEnderecoDoCliente(manager, cliente, enderecoId);

      await marcarComoPrincipal(manager, cliente, endereco);

      return manager.save(endereco);
    });
  }

  static async atualizar(
    tenantId: string,
    clienteId: string,
    enderecoId: string,
    dto: UpdateEnderecoClienteDto
  ): Promise<EnderecoCliente> {
    return AppDataSource.transaction(async (manager) => {
      const cliente = await travarCliente(manager, tenantId, clienteId);
      const endereco = await buscarEnderecoDoCliente(manager, cliente, enderecoId);
      const { principal, ...campos } = dto;

      Object.assign(endereco, campos);

      if (principal) {
        await marcarComoPrincipal(manager, cliente, endereco);
      }

      return manager.save(endereco);
    });
  }

  // Excluir o endereço principal promove outro (o mais recente), para o cliente nunca
  // ficar sem endereço pré-selecionado enquanto tiver algum. Entregas passadas não são
  // afetadas: guardam uma cópia do endereço.
  static async remover(tenantId: string, clienteId: string, enderecoId: string): Promise<void> {
    await AppDataSource.transaction(async (manager) => {
      const cliente = await travarCliente(manager, tenantId, clienteId);
      const endereco = await buscarEnderecoDoCliente(manager, cliente, enderecoId);

      await manager.delete(EnderecoCliente, { id: endereco.id, tenantId: cliente.tenantId });

      if (!endereco.principal) {
        return;
      }

      const restantes = await manager.find(EnderecoCliente, {
        select: { id: true, criadoEm: true },
        where: { clienteId: cliente.id, tenantId: cliente.tenantId },
      });
      const novoPrincipalId = proximoPrincipalAposRemocao(restantes);

      if (novoPrincipalId) {
        await manager.update(EnderecoCliente, { id: novoPrincipalId, tenantId: cliente.tenantId }, { principal: true });
      }
    });
  }
}
