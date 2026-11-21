# PedMesa — API (pedmesa-backend)

API REST do **PedMesa**, sistema multi-tenant de gestão de comandas, pedidos e divisão de conta para bares, restaurantes e lanchonetes. Cada estabelecimento é um _tenant_; garçons, cozinha, caixa e administradores usam o mesmo backend com papéis diferentes.

## Funcionalidades

- Autenticação por JWT com papéis (`admin`, `garcom`, `cozinha`, `caixa`) e painel de super-admin separado.
- Cardápio: categorias e produtos, com disponibilidade controlada pela cozinha.
- Comandas por mesa: integrantes, junção de comandas, extrato com divisão de conta, descontos, pagamentos, pré-conta, fechamento e cancelamento.
- Pedidos e itens com fluxo de preparo para o KDS da cozinha.
- Fila de impressão térmica (ESC/POS por TCP e agente desktop `pedmesa-print-agent`).
- Dashboard do administrador, gestão de usuários e configurações do estabelecimento.
- Super-admin: cadastro, status e impersonação de tenants e leitura dos leads da landing page.
- Delivery: modelagem de banco pronta na `main` (clientes, endereços, taxas, entregas); as rotas estão na branch do épico PED-82 (ver `docs/ANDAMENTO.md`).

## Stack

Node.js, TypeScript (`strict`), Express 4, TypeORM 0.3 e PostgreSQL 16. Testes com Vitest e Supertest; lint e formatação com Biome; Husky e Commitlint nos commits.

## Pré-requisitos

- Node.js 26 (o CI usa Node 26) e npm.
- Docker Desktop, para o banco local e o banco de testes.

## Ambientes

| Ambiente              | Branch   | API                              |
| --------------------- | -------- | -------------------------------- |
| Desenvolvimento local | qualquer | `http://localhost:3000/api/v1`   |
| Homologação           | `main`   | `https://api-dev.pedmesa.com.br` |
| Produção              | `prod`   | `https://api.pedmesa.com.br`     |

O deploy é feito pelo Coolify. A publicação automatizada por pipeline está planejada na PED-119 (ver `docs/CICD.md`).

## Como executar

1. **Variáveis de ambiente:** copie `.env.example` para `.env` e preencha.

   | Variável                                                      | Uso                                                                     |
   | ------------------------------------------------------------- | ----------------------------------------------------------------------- |
   | `PORT`, `NODE_ENV`                                            | porta e ambiente da API                                                 |
   | `CORS_ORIGIN`                                                 | origens liberadas, separadas por vírgula (5173 = frontend, 5174 = site) |
   | `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | PostgreSQL                                                              |
   | `JWT_SECRET`, `JWT_EXPIRES_IN`                                | token dos usuários dos tenants                                          |
   | `SUPER_ADMIN_JWT_SECRET`                                      | token do super-admin (segredo separado)                                 |
   | `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_SENHA`                      | usados pelo `npm run seed:super-admin`                                  |
   | `PRINT_FAILURE_RATE`                                          | taxa de falha simulada da impressora mock (0 a 1)                       |

   > O `.env` de desenvolvimento costuma apontar para o Postgres compartilhado da VPS. Para um banco só seu, suba o `docker-compose.yml` (Postgres na porta 5432) e aponte o `.env` para `localhost`.

2. **Dependências:** `npm install` (instala também os hooks do Husky).
3. **Banco:** `npm run migration:run` e depois `npm run seed` (idempotente).
4. **Desenvolvimento:** `npm run dev` (recarrega ao salvar).

## Scripts

| Script                                                                                   | O que faz                                                      |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `npm run dev`                                                                            | API com `tsx watch`                                            |
| `npm run build` / `npm start`                                                            | compila para `dist/` e executa                                 |
| `npm run check`                                                                          | `tsc` do código e dos testes + Biome com `--error-on-warnings` |
| `npm run format`                                                                         | formata e aplica as correções seguras do Biome                 |
| `npm run lint`                                                                           | só o lint do Biome                                             |
| `npm test`                                                                               | todos os testes (unitários e de integração)                    |
| `npm run test:unit`                                                                      | só os testes unitários (`src/**/*.test.ts`), sem banco         |
| `npm run test:integration`                                                               | só os testes de integração (`tests/`), com banco               |
| `npm run migration:run` / `migration:generate` / `migration:create` / `migration:revert` | migrations do TypeORM                                          |
| `npm run seed` / `npm run seed:super-admin`                                              | dados iniciais e super-admin                                   |

## Testes

Os testes unitários cobrem a lógica pura (DTO validators e calculators) e não precisam de banco. Os testes de integração sobem a API com Supertest contra um PostgreSQL **descartável**:

1. Copie `.env.test.example` para `.env.test` (o `DB_NAME` **precisa** terminar em `_test`; a suíte se recusa a rodar se não terminar).
2. Suba o banco de testes: `docker compose -f docker-compose.test.yml up -d` (porta 5433, dados em memória).
3. Rode `npm test`. O setup global aplica as migrations e o seed antes da suíte.
4. Ao terminar: `docker compose -f docker-compose.test.yml down`.

> **Windows + Git Bash:** se o Vitest falhar com `Cannot read properties of undefined (reading 'config')`, o terminal está no caminho com a letra do drive minúscula (`d:/...`). Rode pelo PowerShell ou a partir de `D:\...`.

## Docker

O `docker-compose.yml` sobe um PostgreSQL local para desenvolvimento e o `docker-compose.test.yml`, o banco de testes. O Dockerfile da API está planejado na PED-117.

## CI/CD

O workflow `.github/workflows/ci.yml` roda em todo Pull Request para `main` e `prod` com três jobs: **Qualidade** (`npm run check` e `npm run build`), **Testes** (com PostgreSQL de serviço) e **Commits** (Commitlint). O Dependabot abre PRs semanais de npm e mensais de GitHub Actions. Detalhes em `docs/CICD.md`.

## Estrutura do projeto

```text
src/
  app.ts            # instância do Express, middlewares e rotas (usada pelo Supertest)
  server.ts         # conecta no banco e faz o listen
  config/           # data-source do TypeORM
  database/         # migrations e seeds
  modules/<modulo>/ # routes, controllers, dtos, services, mappers e entities
  shared/           # erros, middlewares, tipos e utilitários
tests/              # testes de integração (setup, helpers e suítes)
docs/               # arquitetura, requisitos, andamento, gitflow, CI/CD e ADRs
.agents/            # guardrails e modelo de plano para agentes de IA
```

## Fluxo de contribuição

GitLab Flow com uma branch por épico (`PED-<ID>-<titulo-do-epico>`), um commit por tarefa no formato `tipo(escopo): [PED-<ID>] descrição` e Pull Request com o CI verde. Detalhes em `docs/GITFLOW.md`; regras para agentes de IA em `.agents/AGENTS.md`.

## Documentação adicional

- `docs/ARQUITETURA.md`: camadas, modelo de dados, autenticação e regras implementadas.
- `docs/REQUISITOS.md`: requisitos funcionais, não funcionais e regras de negócio.
- `docs/ANDAMENTO.md`: o que está pronto, em andamento e planejado.
- `docs/GITFLOW.md` e `docs/CICD.md`: fluxo de branches e pipelines.
- `docs/adr/`: decisões de arquitetura registradas.
- `docs/api-endpoints.md`, `docs/banco-de-dados.md` e `docs/arquitetura-impressao.md`: documentos do planejamento inicial, anteriores a várias entregas. Servem de visão geral; a fonte da verdade é o código e o `ARQUITETURA.md`.
