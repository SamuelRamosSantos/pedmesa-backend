import { AppDataSource } from "../../../config/data-source";
import { AppError } from "../../../shared/errors/app-error";
import { isUniqueViolation } from "../../../shared/utils/is-unique-violation";
import { CreateClienteDto } from "../dtos/create-cliente.dto";
import { ListarClientesQuery } from "../dtos/listar-clientes.dto";
import { UpdateClienteDto } from "../dtos/update-cliente.dto";
import { Cliente } from "../entities/cliente.entity";
import { EnderecoCliente } from "../entities/endereco-cliente.entity";
import { EnderecoClienteService } from "./endereco-cliente.service";
import {
  interpretarTermoBusca,
  LETRAS_ACENTUADAS,
  LETRAS_SEM_ACENTO,
  padraoContem,
} from "./termo-busca-cliente";

export interface ClienteComEnderecos {
  cliente: Cliente;
  enderecos: EnderecoCliente[];
}

export interface PaginaClientes {
  clientes: ClienteComEnderecos[];
  total: number;
}

function erroTelefoneDuplicado(telefone: string): AppError {
  return new AppError(`Já existe um cliente com o telefone ${telefone}.`, 409);
}

export class ClienteService {
  // Não encontrar é um resultado esperado no formulário (cliente novo): devolve null.
  static async buscarPorTelefone(
    tenantId: string,
    telefone: string,
  ): Promise<ClienteComEnderecos | null> {
    const cliente = await AppDataSource.getRepository(Cliente).findOneBy({
      tenantId,
      telefone,
    });

    if (!cliente) {
      return null;
    }

    return {
      cliente,
      enderecos: await EnderecoClienteService.listar(tenantId, cliente.id),
    };
  }

  // Busca única por nome ou telefone (PED-122): só dígitos procuram um trecho do
  // telefone; com letras, um trecho do nome, sem diferenciar maiúsculas e acentos.
  static async listar(
    tenantId: string,
    filtro: ListarClientesQuery,
  ): Promise<PaginaClientes> {
    const query = AppDataSource.getRepository(Cliente)
      .createQueryBuilder("cliente")
      .where("cliente.tenantId = :tenantId", { tenantId });
    const termo = interpretarTermoBusca(filtro.busca);

    if (termo.tipo === "telefone") {
      query.andWhere("cliente.telefone LIKE :padrao", {
        padrao: padraoContem(termo.digitos),
      });
    }

    if (termo.tipo === "nome") {
      query.setParameters({
        acentuadas: LETRAS_ACENTUADAS,
        semAcento: LETRAS_SEM_ACENTO,
      });

      // Um filtro por palavra; o nome do parâmetro usa só o índice (nunca o texto).
      termo.palavras.forEach((palavra, indice) => {
        query.andWhere(
          `lower(translate(cliente.nome, :acentuadas, :semAcento)) LIKE :palavra${indice}`,
          { [`palavra${indice}`]: padraoContem(palavra) },
        );
      });
    }

    const [clientes, total] = await query
      .orderBy("cliente.nome", "ASC")
      .addOrderBy("cliente.id", "ASC")
      .offset((filtro.pagina - 1) * filtro.porPagina)
      .limit(filtro.porPagina)
      .getManyAndCount();
    const enderecos = await EnderecoClienteService.listarDeVarios(
      tenantId,
      clientes.map((cliente) => cliente.id),
    );

    return {
      clientes: clientes.map((cliente) => ({
        cliente,
        enderecos: enderecos.get(cliente.id) ?? [],
      })),
      total,
    };
  }

  static async criar(
    tenantId: string,
    dto: CreateClienteDto,
  ): Promise<Cliente> {
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

  static async atualizar(
    tenantId: string,
    clienteId: string,
    dto: UpdateClienteDto,
  ): Promise<ClienteComEnderecos> {
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

    return {
      cliente,
      enderecos: await EnderecoClienteService.listar(tenantId, cliente.id),
    };
  }
}
