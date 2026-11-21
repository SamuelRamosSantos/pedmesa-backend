# Andamento — PedMesa

> **Fonte:** Jira (projeto PED, `samuelramos.atlassian.net`) e branches do Git.
> **Posição em:** 21/11/2026.
> **Regra de atualização:** toda tarefa que muda o que está pronto, em andamento ou planejado atualiza este arquivo na mesma entrega.

## 1. Resumo por épico

| Épico  | Título                                                      | Jira                                 | Código                                                                        |
| ------ | ----------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------- |
| PED-1  | Documentação & Arquitetura Inicial                          | Feito                                | na `main`                                                                     |
| PED-2  | Backend & Banco de Dados                                    | Feito                                | na `main`                                                                     |
| PED-3  | Frontend & Mobile                                           | Feito                                | na `main` (frontend)                                                          |
| PED-23 | Refinamentos de Usabilidade e Regras de Negócio             | Feito                                | na `main`                                                                     |
| PED-24 | Super-Admin, Dashboard e Branding                           | A fazer (PED-45 a PED-47 em análise) | parte na `main`; upload de imagem na branch PED-53                            |
| PED-53 | Validação e Hardening de Segurança (via Dockerfile + CI/CD) | A fazer                              | branch `PED-53-validacao-e-hardening-de-seguranca` (4 commits fora da `main`) |
| PED-80 | Delivery · Modelagem de Banco                               | Feito                                | na `main`                                                                     |
| PED-81 | Delivery · Regras de Negócio                                | Feito                                | branch `PED-82-delivery-frontend` (ainda não mesclada)                        |
| PED-82 | Delivery · Frontend                                         | A fazer                              | branch `PED-82-delivery-frontend` (16 commits fora da `main`)                 |

## 2. Implementado (na `main`)

- Multi-tenant com JWT, papéis e super-admin com impersonação auditada.
- Cardápio, comandas, integrantes, junção, pedidos e KDS.
- Extrato com divisão de conta, descontos, pagamentos, pré-conta, fechamento e cancelamento.
- Fila de impressão por TCP e pelo agente desktop.
- Dashboard, usuários, configurações do tenant e leads.
- Tabelas do delivery (clientes, endereços, taxas, entregas, histórico e sequência).
- Organização do repositório: Biome, Husky + Commitlint, guardrails de IA (`.agents/`), documentação em `docs/`, suíte de integração com banco `_test`, `/ready`, CI e Dependabot.

## 3. Em andamento (fora da `main`)

- **Delivery (PED-81 e PED-82):** rotas de clientes e delivery, cotação de frete, sincronização do preparo com a entrega (PED-98), telas de novo pedido e painel de expedição.
- **Hardening (PED-53):** cookie HttpOnly para o token (PED-76), revalidação de sessão (PED-77), rate limit (PED-78) e upload de imagens (PED-45, PED-46).

## 4. Planejado

- PED-117 a PED-121: Dockerfile do backend, padronização dos Dockerfiles do front, pipeline de deploy no Coolify e verificação de segurança pós-deploy.
- PED-59, PED-64 e PED-69: cabeçalhos de segurança, redução de exposição de informações e mitigação do BREACH.
- PED-54 e PED-71: hardening manual do SSH e da rede do servidor.
- PED-114: padronizar o fuso horário entre Node e Postgres.
- PED-116: seed com categorias e produtos de exemplo.

## 5. Pendências conhecidas

- **PED-115 (bug):** o status de preparo do pedido fica desatualizado quando o KDS avança itens em paralelo.
- Antes de mesclar as branches PED-53 e PED-82, elas precisam passar pelo `npm run format`, porque a `main` foi reformatada pelo Biome.
- `docs/api-endpoints.md` e `docs/banco-de-dados.md` estão desatualizados em relação ao código.

## 6. Impacto previsto na arquitetura

- O delivery adiciona rotas de `clientes` e `delivery` e um handler de sincronização entre pedidos e entregas (eventos internos).
- O PED-53 troca o token em `localStorage` por cookie HttpOnly: CORS com `credentials` e leitura do cookie no `authMiddleware`.
- O PED-117 e o PED-119 trazem Dockerfile, imagem no GHCR e deploy automatizado.

## 7. Documentos relacionados

`docs/ARQUITETURA.md`, `docs/REQUISITOS.md`, `docs/GITFLOW.md`, `docs/CICD.md` e `docs/adr/`.
