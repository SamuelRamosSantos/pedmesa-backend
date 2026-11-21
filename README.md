# PedMesa — API (pedmesa-backend)

API REST do **PedMesa**, sistema multi-tenant de gestão de comandas, pedidos, delivery e divisão de conta para bares, restaurantes e lanchonetes. Cada estabelecimento é um _tenant_; garçons, cozinha, caixa, expedição e administradores usam o mesmo backend com papéis diferentes.

## Funcionalidades

- Sessão em cookie HttpOnly (JWT) com papéis (`admin`, `garcom`, `cozinha`, `caixa`, `expedicao`) e painel de super-admin com sessão separada.
- Cardápio: categorias e produtos (com imagem), disponibilidade controlada pela cozinha.
- Comandas por mesa: integrantes, junção, extrato com divisão de conta, descontos, pagamentos, pré-conta, fechamento e cancelamento.
- Pedidos e itens com fluxo de preparo para o KDS da cozinha.
- Delivery: clientes e endereços, taxas por bairro, cotação de frete, pedido delivery com troco, painel de expedição e sincronização do status da entrega com o preparo.
- Fila de impressão térmica (ESC/POS por TCP e agente desktop `pedmesa-print-agent`), incluindo tickets de entrega.
- Upload de imagens em disco local (desenvolvimento) ou em storage compatível com S3 (produção).
- Dashboard do administrador, gestão de usuários e configurações do estabelecimento (inclusive do delivery).
- Super-admin: cadastro, status e impersonação de tenants e leitura dos leads da landing page.
- Rate limit geral e um limite mais restrito para tentativas de login que falham.

## Stack

Node.js, TypeScript (`strict`), Express 4, TypeORM 0.3 e PostgreSQL 16; `cookie-parser`, `express-rate-limit`, `multer` e `@aws-sdk/client-s3`. Testes com Vitest e Supertest; lint e formatação com Biome; Husky e Commitlint nos commits.

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

   | Variável                                                                                                                         | Uso                                                                                                                                                            |
   | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `PORT`, `NODE_ENV`                                                                                                               | porta e ambiente; em `production` o cookie fica `secure` e a API confia no primeiro proxy (`trust proxy`)                                                      |
   | `CORS_ORIGIN`                                                                                                                    | origens liberadas, separadas por vírgula (5173 = frontend, 5174 = site). Precisa listar a origem exata do frontend, porque a sessão é cookie com `credentials` |
   | `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`                                                                    | PostgreSQL                                                                                                                                                     |
   | `JWT_SECRET`, `JWT_EXPIRES_IN`                                                                                                   | sessão dos usuários dos tenants (também define a validade do cookie)                                                                                           |
   | `SUPER_ADMIN_JWT_SECRET`                                                                                                         | sessão do super-admin (segredo separado)                                                                                                                       |
   | `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_SENHA`                                                                                         | usados pelo `npm run seed:super-admin`                                                                                                                         |
   | `PRINT_FAILURE_RATE`                                                                                                             | taxa de falha simulada da impressora mock (0 a 1)                                                                                                              |
   | `STORAGE_DRIVER`                                                                                                                 | `local` (padrão) ou `s3`                                                                                                                                       |
   | `UPLOADS_DIR`, `PUBLIC_URL_BASE`                                                                                                 | pasta e URL pública dos uploads no driver `local`                                                                                                              |
   | `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE`, `S3_PUBLIC_URL_BASE` | driver `s3` (AWS S3, R2, MinIO...)                                                                                                                             |
   | `API_RATE_LIMIT_WINDOW_MS`, `API_RATE_LIMIT_MAX`                                                                                 | limite geral da API                                                                                                                                            |
   | `AUTH_RATE_LIMIT_WINDOW_MS`, `AUTH_RATE_LIMIT_MAX`                                                                               | limite de logins que falham                                                                                                                                    |

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

Os testes unitários cobrem a lógica pura (DTO validators, calculators e transições) e não precisam de banco. Os testes de integração sobem a API com Supertest contra um PostgreSQL **descartável**:

1. Copie `.env.test.example` para `.env.test` (o `DB_NAME` **precisa** terminar em `_test` e o `DB_HOST` precisa ser local; a suíte se recusa a rodar se não for).
2. Suba o banco de testes: `docker compose -f docker-compose.test.yml up -d` (porta 5433, dados em memória).
3. Rode `npm test`. O setup global aplica as migrations e o seed antes da suíte.
4. Ao terminar: `docker compose -f docker-compose.test.yml down`.

Para um teste autenticado, use `autenticar(usuario)` de `tests/helpers/factories.ts`: ele faz o login e devolve um cliente que guarda o cookie de sessão.

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
  config/           # data-source do TypeORM, carga do .env e trava do banco de testes
  database/         # migrations e seeds
  modules/<modulo>/ # routes, controllers, dtos, services, mappers e entities
  shared/           # erros, middlewares, storage, tipos e utilitários
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
