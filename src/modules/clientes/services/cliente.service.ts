import { AppDataSource } from "../../../config/data-source";
import { AppError } from "../../../shared/errors/app-error";
import { isUniqueViolation } from "../../../shared/utils/is-unique-violation";
import { CreateClienteDto } from "../dtos/create-cliente.dto";
import { UpdateClienteDto } from "../dtos/update-cliente.dto";
import { Cliente } from "../entities/cliente.entity";
import { EnderecoCliente } from "../entities/endereco-cliente.entity";
import { EnderecoClienteService } from "./endereco-cliente.service";

export interface ClienteComEnderecos {
  cliente: Cliente;
  enderecos: EnderecoCliente[];
}

function erroTelefoneDuplicado(telefone: string): AppError {
  return new AppError(`Já existe um cliente com o telefone ${telefone}.`, 409);
}

export class ClienteService {
  // Não encontrar é um resultado esperado no formulário (cliente novo): devolve null.
  static async buscarPorTelefone(tenantId: string, telefone: string): Promise<ClienteComEnderecos | null> {
    const cliente = await AppDataSource.getRepository(Cliente).findOneBy({ tenantId, telefone });

    if (!cliente) {
      return null;
    }

    return { cliente, enderecos: await EnderecoClienteService.listar(tenantId, cliente.id) };
  }

  static async criar(tenantId: string, dto: CreateClienteDto): Promise<Cliente> {
    const repository = AppDataSource.getRepository(Cliente);

    try {
      return await repository.save(repository.create({ tenantId, ...dto }));
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw erroTelefoneDuplicado(dto.telefone);
      }

      throw error;
    }
  }

  static async atualizar(tenantId: string, clienteId: string, dto: UpdateClienteDto): Promise<ClienteComEnderecos> {
    const repository = AppDataSource.getRepository(Cliente);
    const cliente = await repository.findOneBy({ id: clienteId, tenantId });

    if (!cliente) {
      throw new AppError("Cliente não encontrado.", 404);
    }

    Object.assign(cliente, dto);

    try {
      await repository.save(cliente);
    } catch (error) {
      if (isUniqueViolation(error) && dto.telefone) {
        throw erroTelefoneDuplicado(dto.telefone);
      }

      throw error;
    }

    return { cliente, enderecos: await EnderecoClienteService.listar(tenantId, cliente.id) };
  }
}
