import { User, UserRole } from "../entities/user.entity";

export interface UserResponse {
  id: string;
  nome: string;
  email: string;
  roles: UserRole[];
  pode_excluir_item_fechamento: boolean;
  ativo: boolean;
  criado_em: Date;
}

export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    roles: user.roles,
    pode_excluir_item_fechamento: user.podeExcluirItemFechamento,
    ativo: user.ativo,
    criado_em: user.criadoEm,
  };
}
