# 🗄️ Modelagem do Banco de Dados - PedMesa (DER)

Este documento descreve o modelo relacional do banco de dados do PedMesa.

## 1. Regras Globais de Arquitetura

- Multi-tenancy: Quase todas as tabelas operacionais possuem a coluna tenant_id (UUID), garantindo isolamento absoluto dos dados de cada estabelecimento/lanchonete desde a primeira versão.
- Divisão Inteligente de Conta: A tabela itens_pedido possui a coluna opcional integrante_id (FK para integrantes_comanda). Se for preenchida, o item pertence àquela pessoa específica; se for NULL, o item é compartilhado entre todos os integrantes da mesa/comanda.

---

## 2. Diagrama de Entidades e Relacionamentos (Mermaid)

```mermaid
erDiagram
TENANTS ||--o{ USUARIOS : possui
TENANTS ||--o{ CATEGORIAS : possui
TENANTS ||--o{ PRODUTOS : possui
TENANTS ||--o{ COMANDAS : possui

    CATEGORIAS ||--o{ PRODUTOS : contem

    COMANDAS ||--o{ INTEGRANTES_COMANDA : possui
    COMANDAS ||--o{ PEDIDOS : possui

    PEDIDOS ||--o{ ITENS_PEDIDO : contem
    PRODUTOS ||--o{ ITENS_PEDIDO : referencia
    INTEGRANTES_COMANDA ||--o| ITENS_PEDIDO : consome
    USUARIOS ||--o{ PEDIDOS : lança

    TENANTS {
        uuid id PK
        string nome_fantasia
        string cnpj_cpf
        boolean ativo
        datetime criado_em
    }

    USUARIOS {
        uuid id PK
        uuid tenant_id FK
        string nome
        string email
        string senha_hash
        string role "admin | garcom | cozinha | caixa"
        boolean ativo
    }

    CATEGORIAS {
        uuid id PK
        uuid tenant_id FK
        string nome
        int ordem_exibicao
        boolean ativo
    }

    PRODUTOS {
        uuid id PK
        uuid tenant_id FK
        uuid categoria_id FK
        string nome
        decimal preco
        string descricao
        boolean disponivel
    }

    COMANDAS {
        uuid id PK
        uuid tenant_id FK
        int numero_comanda
        string status "aberta | fechada"
        uuid comanda_pai_id FK "Usado para juncao de comandas"
        datetime aberta_em
        datetime fechada_em
    }

    INTEGRANTES_COMANDA {
        uuid id PK
        uuid comanda_id FK
        string nome "Ex: João, Maria"
    }

    PEDIDOS {
        uuid id PK
        uuid comanda_id FK
        uuid usuario_id FK "Garcom que lancou"
        string status_preparo "pendente | em_preparo | pronto | entregue"
        datetime criado_em
    }

    ITENS_PEDIDO {
        uuid id PK
        uuid pedido_id FK
        uuid produto_id FK
        uuid integrante_id FK "NULL = Compartilhado entre a mesa"
        int quantidade
        decimal preco_unitario
        string observacao "Ex: Sem cebola, ponto bem passado"
        string status_item "pendente | em_preparo | pronto | entregue"
    }
```

---

## 3. Dicionário de Dados & Descrição dos Campos

### tenants (Estabelecimentos / Assinantes)

Armazena a empresa cadastrada no SaaS.

- id: Chave primária única (UUID).
- nome_fantasia: Nome do estabelecimento.

### usuarios (Colaboradores e Perfis)

- role: Define as permissões de acesso via RBAC (admin, garcom, cozinha, caixa).

### comandas (Gestão das Mesas)

- status: Controla se a mesa está em atendimento (aberta) ou se a conta foi quitada (fechada).
- comanda_pai_id: Coluna auto-relacionada usada para o Agrupamento/Junção de Comandas. Quando o caixa junta a comanda 05 na comanda 06, a 05 aponta o comanda_pai_id para o ID da 06.

### integrantes_comanda (Pessoas na Mesa)

Nomes cadastrados pelo garçom ao abrir a comanda (ex: João, Maria).

### itens_pedido (O Coração da Divisão de Conta)

- integrante_id:
  - Preenchido (UUID): O item é individual e será cobrado exclusivamente no extrato daquele integrante.
  - NULL: O item é coletivo (ex: Porção de Batatas, Jarra de Suco) e seu valor total será dividido entre todos os integrantes cadastrados na comanda no momento do fechamento.
