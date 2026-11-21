import { AppError } from "../../../shared/errors/app-error";
import { isUuid } from "../../../shared/utils/is-uuid";

export interface CreateProductDto {
  categoriaId: string;
  nome: string;
  preco: number;
  descricao: string | null;
  disponivel: boolean;
  precisaPreparo: boolean;
  imagemUrl: string | null;
}

export function assertValidCreateProductDto(body: unknown): CreateProductDto {
  const {
    categoria_id: categoriaId,
    nome,
    preco,
    descricao,
    disponivel,
    precisa_preparo: precisaPreparo,
    imagem_url: imagemUrl,
  } = (body ?? {}) as Record<string, unknown>;

  if (!isUuid(categoriaId)) {
    throw new AppError("categoria_id inválido.", 400);
  }

  if (typeof nome !== "string" || nome.trim().length === 0) {
    throw new AppError("Nome do produto é obrigatório.", 400);
  }

  if (typeof preco !== "number" || !Number.isFinite(preco) || preco <= 0) {
    throw new AppError("Preço deve ser um número maior que zero.", 400);
  }

  if (descricao !== undefined && descricao !== null && typeof descricao !== "string") {
    throw new AppError("Descrição inválida.", 400);
  }

  if (disponivel !== undefined && typeof disponivel !== "boolean") {
    throw new AppError("Campo disponivel deve ser booleano.", 400);
  }

  if (precisaPreparo !== undefined && typeof precisaPreparo !== "boolean") {
    throw new AppError("Campo precisa_preparo deve ser booleano.", 400);
  }

  if (imagemUrl !== undefined && imagemUrl !== null && typeof imagemUrl !== "string") {
    throw new AppError("Campo imagem_url inválido.", 400);
  }

  return {
    categoriaId,
    nome: nome.trim(),
    preco,
    descricao: typeof descricao === "string" ? descricao : null,
    disponivel: typeof disponivel === "boolean" ? disponivel : true,
    precisaPreparo: typeof precisaPreparo === "boolean" ? precisaPreparo : true,
    imagemUrl: typeof imagemUrl === "string" ? imagemUrl : null,
  };
}
