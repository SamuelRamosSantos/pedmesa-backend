import { AppDataSource } from "../../../config/data-source";
import { AppError } from "../../../shared/errors/app-error";
import {
  prepararNovaImagem,
  removerImagemSemFalhar,
} from "../../../shared/storage/get-storage-service";
import { isUniqueViolation } from "../../../shared/utils/is-unique-violation";
import { HashService } from "../../auth/services/hash.service";
import { CreateUserDto } from "../dtos/create-user.dto";
import { UpdateUserDto } from "../dtos/update-user.dto";
import { User } from "../entities/user.entity";
import { assertNaoAlteraProprioAcesso } from "./user-access-guard";

const EMAIL_EM_USO_MESSAGE = "Já existe um usuário cadastrado com este e-mail.";

export class UserService {
  static async create(tenantId: string, dto: CreateUserDto): Promise<User> {
    const repository = AppDataSource.getRepository(User);
    const senhaHash = await HashService.hash(dto.senha);
    const fotoUrl = await prepararNovaImagem(dto.fotoUrl, tenantId);

    const user = repository.create({
      tenantId,
      nome: dto.nome,
      email: dto.email,
      senhaHash,
      roles: dto.roles,
      podeExcluirItemFechamento: dto.podeExcluirItemFechamento,
      podeConcederDesconto: dto.podeConcederDesconto,
      fotoUrl,
      ativo: true,
    });

    try {
      return await repository.save(user);
    } catch (error) {
      // A cópia definitiva não chegou ao banco: apaga para não virar lixo.
      await removerImagemSemFalhar(fotoUrl);

      if (isUniqueViolation(error)) {
        throw new AppError(EMAIL_EM_USO_MESSAGE, 409);
      }
      throw error;
    }
  }

  static async list(tenantId: string): Promise<User[]> {
    const repository = AppDataSource.getRepository(User);
    return repository.find({ where: { tenantId }, order: { nome: "ASC" } });
  }

  static async update(
    tenantId: string,
    userId: string,
    actingUserId: string,
    dto: UpdateUserDto,
  ): Promise<User> {
    const repository = AppDataSource.getRepository(User);
    const user = await repository.findOne({ where: { id: userId, tenantId } });

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    assertNaoAlteraProprioAcesso({
      isSelf: user.id === actingUserId,
      rolesAtuais: user.roles,
      novasRoles: dto.roles,
      novoAtivo: dto.ativo,
    });

    if (dto.nome !== undefined) {
      user.nome = dto.nome;
    }

    if (dto.email !== undefined) {
      user.email = dto.email;
    }

    if (dto.roles !== undefined) {
      user.roles = dto.roles;
    }

    if (dto.podeExcluirItemFechamento !== undefined) {
      user.podeExcluirItemFechamento = dto.podeExcluirItemFechamento;
    }

    if (dto.podeConcederDesconto !== undefined) {
      user.podeConcederDesconto = dto.podeConcederDesconto;
    }

    if (dto.ativo !== undefined) {
      user.ativo = dto.ativo;
    }

    const fotoAnterior = user.fotoUrl;
    let fotoPromovida: string | null = null;

    // Reenviar a mesma URL (ex.: foto gravada antes do R2) não é troca de foto.
    if (dto.fotoUrl !== undefined && dto.fotoUrl !== fotoAnterior) {
      fotoPromovida = await prepararNovaImagem(dto.fotoUrl, tenantId);
      user.fotoUrl = fotoPromovida;
    }

    let salvo: User;

    try {
      salvo = await repository.save(user);
    } catch (error) {
      // A cópia definitiva não chegou ao banco: apaga para não virar lixo.
      await removerImagemSemFalhar(fotoPromovida);

      if (isUniqueViolation(error)) {
        throw new AppError(EMAIL_EM_USO_MESSAGE, 409);
      }
      throw error;
    }

    // Só depois de salvar: se o save falhar, a foto antiga continua em uso.
    if (fotoAnterior !== salvo.fotoUrl) {
      await removerImagemSemFalhar(fotoAnterior);
    }

    return salvo;
  }

  static async changePassword(
    tenantId: string,
    userId: string,
    novaSenha: string,
  ): Promise<void> {
    const repository = AppDataSource.getRepository(User);
    const user = await repository.findOne({ where: { id: userId, tenantId } });

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    user.senhaHash = await HashService.hash(novaSenha);
    await repository.save(user);
  }

  static async updateAtivo(
    tenantId: string,
    userId: string,
    actingUserId: string,
    ativo: boolean,
  ): Promise<User> {
    const repository = AppDataSource.getRepository(User);
    const user = await repository.findOne({ where: { id: userId, tenantId } });

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    assertNaoAlteraProprioAcesso({
      isSelf: user.id === actingUserId,
      rolesAtuais: user.roles,
      novoAtivo: ativo,
    });

    user.ativo = ativo;
    return repository.save(user);
  }
}
