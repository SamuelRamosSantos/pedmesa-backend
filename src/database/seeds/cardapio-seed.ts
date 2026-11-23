import { AppDataSource } from "../../config/data-source";
import { assertValidCreateCategoryDto } from "../../modules/categorias/dtos/create-category.dto";
import { Category } from "../../modules/categorias/entities/category.entity";
import { CategoryService } from "../../modules/categorias/services/category.service";
import { assertValidCreateProductDto } from "../../modules/produtos/dtos/create-product.dto";
import { Product } from "../../modules/produtos/entities/product.entity";
import { ProductService } from "../../modules/produtos/services/product.service";
import { Tenant } from "../../modules/tenants/entities/tenant.entity";

// Cardápio de exemplo para testes manuais (mesa, KDS e delivery).
// Idempotente: categoria e produto são procurados pelo nome no tenant antes de criar, e os
// dados passam pelos mesmos DTO validators e services da API (ex.: com o módulo de cozinha
// desligado, o service grava precisa_preparo = false).

interface ProdutoSeed {
  nome: string;
  preco: number;
  descricao: string | null;
  // Bebida pronta (lata, água) não passa pela cozinha.
  precisaPreparo: boolean;
  // Um item esgotado para testar o "Esgotado" no cardápio.
  disponivel?: boolean;
}

const CARDAPIO_SEED: {
  categoria: string;
  ordem: number;
  produtos: ProdutoSeed[];
}[] = [
  {
    categoria: "Lanches",
    ordem: 1,
    produtos: [
      {
        nome: "X-Burger",
        preco: 22,
        descricao: "Pão, hambúrguer 150g, queijo e molho da casa",
        precisaPreparo: true,
      },
      {
        nome: "X-Salada",
        preco: 24,
        descricao: "Hambúrguer 150g, queijo, alface, tomate e maionese",
        precisaPreparo: true,
      },
      {
        nome: "X-Bacon",
        preco: 27.9,
        descricao: "Hambúrguer 150g, queijo e bacon crocante",
        precisaPreparo: true,
      },
      {
        nome: "X-Tudo",
        preco: 32.5,
        descricao: "Hambúrguer, ovo, bacon, presunto, queijo e salada",
        precisaPreparo: true,
      },
      {
        nome: "Misto Quente",
        preco: 14,
        descricao: "Pão de forma, presunto e queijo",
        precisaPreparo: true,
      },
    ],
  },
  {
    categoria: "Porções",
    ordem: 2,
    produtos: [
      {
        nome: "Batata Frita",
        preco: 19.9,
        descricao: "Porção de 400g",
        precisaPreparo: true,
      },
      {
        nome: "Batata com Cheddar e Bacon",
        preco: 29.9,
        descricao: "Porção de 400g",
        precisaPreparo: true,
      },
      {
        nome: "Anéis de Cebola",
        preco: 22,
        descricao: "Porção de 300g",
        precisaPreparo: true,
      },
      {
        nome: "Frango a Passarinho",
        preco: 34.9,
        descricao: "Porção de 500g com molho",
        precisaPreparo: true,
      },
    ],
  },
  {
    categoria: "Bebidas",
    ordem: 3,
    produtos: [
      {
        nome: "Refrigerante Lata",
        preco: 6.5,
        descricao: "350ml",
        precisaPreparo: false,
      },
      {
        nome: "Água Mineral",
        preco: 4,
        descricao: "500ml, com ou sem gás",
        precisaPreparo: false,
      },
      {
        nome: "Suco Natural de Laranja",
        preco: 9,
        descricao: "500ml",
        precisaPreparo: true,
      },
      {
        nome: "Cerveja Long Neck",
        preco: 9.9,
        descricao: "355ml",
        precisaPreparo: false,
      },
    ],
  },
  {
    categoria: "Sobremesas",
    ordem: 4,
    produtos: [
      {
        nome: "Pudim",
        preco: 10,
        descricao: "Fatia de pudim de leite",
        precisaPreparo: false,
      },
      {
        nome: "Petit Gâteau",
        preco: 18,
        descricao: "Com sorvete de creme",
        precisaPreparo: true,
      },
      {
        nome: "Milkshake de Morango",
        preco: 16,
        descricao: "400ml",
        precisaPreparo: true,
        disponivel: false,
      },
    ],
  },
];

async function obterCategoria(
  tenantId: string,
  nome: string,
  ordem: number,
): Promise<Category> {
  const existente = await AppDataSource.getRepository(Category).findOneBy({
    tenantId,
    nome,
  });

  if (existente) {
    console.log(`ℹ️  Categoria "${nome}" já existe.`);
    return existente;
  }

  const categoria = await CategoryService.create(
    tenantId,
    assertValidCreateCategoryDto({ nome, ordem_exibicao: ordem }),
  );
  console.log(`✅ Categoria criada: ${nome}`);
  return categoria;
}

async function criarProdutos(
  tenantId: string,
  categoria: Category,
  produtos: ProdutoSeed[],
): Promise<void> {
  const repository = AppDataSource.getRepository(Product);

  for (const produto of produtos) {
    if (await repository.existsBy({ tenantId, nome: produto.nome })) {
      console.log(`ℹ️  Produto "${produto.nome}" já existe.`);
      continue;
    }

    const dto = assertValidCreateProductDto({
      categoria_id: categoria.id,
      nome: produto.nome,
      preco: produto.preco,
      descricao: produto.descricao,
      disponivel: produto.disponivel ?? true,
      precisa_preparo: produto.precisaPreparo,
    });
    await ProductService.create(tenantId, dto);
    console.log(
      `✅ Produto criado: ${produto.nome} — R$ ${produto.preco.toFixed(2)} (${categoria.nome})`,
    );
  }
}

export async function seedCardapio(tenant: Tenant): Promise<void> {
  for (const secao of CARDAPIO_SEED) {
    const categoria = await obterCategoria(
      tenant.id,
      secao.categoria,
      secao.ordem,
    );
    await criarProdutos(tenant.id, categoria, secao.produtos);
  }
}
