import { EntityManager } from "typeorm";
import { AppDataSource } from "../../../config/data-source";
import { AppError } from "../../../shared/errors/app-error";
import { CreateEnderecoClienteDto } from "../dtos/create-endereco-cliente.dto";
import { Cliente } from "../entities/cliente.entity";
import { EnderecoCliente } from "../entities/endereco-cliente.entity";
import { deveSerPrincipal } from "./endereco-principal";

// Trava a linha do cliente até o fim da transação: duas trocas de endereço principal
// simultâneas para o mesmo cliente passam a rodar em fila, em vez de uma delas
// esbarrar no índice único parcial de principal.
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

async function desmarcarPrincipalAtual(manager: EntityManager, cliente: Cliente): Promise<void> {
  await manager.update(
    EnderecoCliente,
    { clienteId: cliente.id, tenantId: cliente.tenantId, principal: true },
    { principal: false }
  );
}

export class EnderecoClienteService {
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
      const endereco = await manager.findOneBy(EnderecoCliente, { id: enderecoId, clienteId: cliente.id, tenantId });

      if (!endereco) {
        throw new AppError("Endereço não encontrado.", 404);
      }

      if (endereco.principal) {
        return endereco;
      }

      // Desmarcar antes de marcar: o índice único parcial não admite dois principais
      // nem por um instante dentro da transação.
      await desmarcarPrincipalAtual(manager, cliente);
      endereco.principal = true;

      return manager.save(endereco);
    });
  }
}
