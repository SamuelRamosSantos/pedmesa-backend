import { AppDataSource } from "../../../config/data-source";
import { AppError } from "../../../shared/errors/app-error";
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

    const user = repository.create({
      tenantId,
      nome: dto.nome,
      email: dto.email,
      senhaHash,
      roles: dto.roles,
      podeExcluirItemFechamento: dto.podeExcluirItemFechamento,
      podeConcederDesconto: dto.podeConcederDesconto,
      fotoUrl: dto.fotoUrl,
      ativo: true,
    });

    try {
      return await repository.save(user);
    } catch (error) {
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

  static async update(tenantId: string, userId: string, actingUserId: string, dto: UpdateUserDto): Promise<User> {
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

    if (dto.fotoUrl !== undefined) {
      user.fotoUrl = dto.fotoUrl;
    }

    try {
      return await repository.save(user);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError(EMAIL_EM_USO_MESSAGE, 409);
      }
      throw error;
    }
  }

  static async changePassword(tenantId: string, userId: string, novaSenha: string): Promise<void> {
    const repository = AppDataSource.getRepository(User);
    const user = await repository.findOne({ where: { id: userId, tenantId } });

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    user.senhaHash = await HashService.hash(novaSenha);
    await repository.save(user);
  }

  static async updateAtivo(tenantId: string, userId: string, actingUserId: string, ativo: boolean): Promise<User> {
    const repository = AppDataSource.getRepository(User);
    const user = await repository.findOne({ where: { id: userId, tenantId } });

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    assertNaoAlteraProprioAcesso({ isSelf: user.id === actingUserId, rolesAtuais: user.roles, novoAtivo: ativo });

    user.ativo = ativo;
    return repository.save(user);
  }
}
