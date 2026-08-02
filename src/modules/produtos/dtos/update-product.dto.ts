import { AppError } from "../../../shared/errors/app-error";
import { isUuid } from "../../../shared/utils/is-uuid";

export interface UpdateProductDto {
  categoriaId?: string;
  nome?: string;
  preco?: number;
  descricao?: string | null;
  disponivel?: boolean;
  precisaPreparo?: boolean;
}

export function assertValidUpdateProductDto(body: unknown): UpdateProductDto {
  const {
    categoria_id: categoriaId,
    nome,
    preco,
    descricao,
    disponivel,
    precisa_preparo: precisaPreparo,
  } = (body ?? {}) as Record<string, unknown>;

  const dto: UpdateProductDto = {};

  if (categoriaId !== undefined) {
    if (!isUuid(categoriaId)) {
      throw new AppError("categoria_id inválido.", 400);
    }
    dto.categoriaId = categoriaId;
  }

  if (nome !== undefined) {
    if (typeof nome !== "string" || nome.trim().length === 0) {
      throw new AppError("Nome do produto é obrigatório.", 400);
    }
    dto.nome = nome.trim();
  }

  if (preco !== undefined) {
    if (typeof preco !== "number" || !Number.isFinite(preco) || preco <= 0) {
      throw new AppError("Preço deve ser um número maior que zero.", 400);
    }
    dto.preco = preco;
  }

  if (descricao !== undefined) {
    if (descricao !== null && typeof descricao !== "string") {
      throw new AppError("Descrição inválida.", 400);
    }
    dto.descricao = descricao;
  }

  if (disponivel !== undefined) {
    if (typeof disponivel !== "boolean") {
      throw new AppError("Campo disponivel deve ser booleano.", 400);
    }
    dto.disponivel = disponivel;
  }

  if (precisaPreparo !== undefined) {
    if (typeof precisaPreparo !== "boolean") {
      throw new AppError("Campo precisa_preparo deve ser booleano.", 400);
    }
    dto.precisaPreparo = precisaPreparo;
  }

  if (Object.keys(dto).length === 0) {
    throw new AppError("Informe ao menos um campo para atualizar.", 400);
  }

  return dto;
}
