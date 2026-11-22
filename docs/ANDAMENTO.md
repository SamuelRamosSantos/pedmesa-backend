# Andamento — PedMesa

> **Fonte:** Jira (projeto PED, `samuelramos.atlassian.net`) e branches do Git.
> **Posição em:** 22/11/2026.
> **Regra de atualização:** toda tarefa que muda o que está pronto, em andamento ou planejado atualiza este arquivo na mesma entrega.

## 1. Resumo por épico

| Épico  | Título                                                      | Jira                                 | Código                                                                                                     |
| ------ | ----------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| PED-1  | Documentação & Arquitetura Inicial                          | Feito                                | na `main`                                                                                                  |
| PED-2  | Backend & Banco de Dados                                    | Feito                                | na `main`                                                                                                  |
| PED-3  | Frontend & Mobile                                           | Feito                                | na `main` (frontend)                                                                                       |
| PED-23 | Refinamentos de Usabilidade e Regras de Negócio             | Feito                                | na `main`                                                                                                  |
| PED-24 | Super-Admin, Dashboard e Branding                           | A fazer (PED-45 a PED-47 em análise) | upload de imagens (PED-45, PED-46) na `main`                                                               |
| PED-53 | Validação e Hardening de Segurança (via Dockerfile + CI/CD) | A fazer                              | cookie HttpOnly, revalidação de sessão e rate limit na `main`; Dockerfile, pipeline e cabeçalhos pendentes |
| PED-80 | Delivery · Modelagem de Banco                               | Feito                                | na `main`                                                                                                  |
| PED-81 | Delivery · Regras de Negócio                                | Feito                                | na `main`                                                                                                  |
| PED-82 | Delivery · Frontend                                         | A fazer                              | branch `PED-82-delivery-frontend`                                                                          |

## 2. Implementado (na `main`)

- Multi-tenant com sessão em cookie HttpOnly, papéis (inclusive `expedicao`) e super-admin com impersonação auditada.
- Cardápio com imagens, comandas, integrantes, junção, pedidos e KDS.
- Extrato com divisão de conta, descontos, pagamentos, pré-conta, fechamento e cancelamento.
- Delivery no backend: clientes e endereços, taxas por bairro, cotação de frete, pedido delivery com troco, painel de expedição, transições de status com concorrência controlada e sincronização com o preparo.
- Fila de impressão por TCP e pelo agente desktop, com tickets de cozinha, pré-conta e entrega.
- Upload de imagens no Cloudflare R2 por tenant (PED-45), rate limit, dashboard, usuários, configurações do tenant e leads.
- Organização do repositório: Biome, Husky + Commitlint, guardrails de IA (`.agents/`), documentação em `docs/`, suíte de integração com banco `_test`, `/ready`, CI e Dependabot.
- Entrega contínua (PED-117 a PED-121): imagens Docker não-root com Node 26 nos três repositórios, migrations no start da API, deploy por GitHub Actions + GHCR + Coolify, verificação de segurança pós-deploy (modo report) e Dependabot também para Docker.

## 3. Em andamento (fora da `main`)

- **Delivery · Frontend (PED-82):** telas de novo pedido, painel Kanban de expedição, taxas e configuração do delivery (PED-105 a PED-111). No backend, a branch traz a cotação de frete sem itens (PED-108), a correção da PED-115, o seed de cardápio (PED-116) e a listagem de clientes com busca única por nome ou telefone, `GET /clientes?busca=&pagina=&por_pagina=` (PED-122).

## 4. Planejado

- PED-59, PED-64 e PED-69: cabeçalhos de segurança, redução de exposição de informações e mitigação do BREACH.
- PED-54 e PED-71: hardening manual do SSH e da rede do servidor.
- PED-114: padronizar o fuso horário entre Node e Postgres.

## 5. Pendências conhecidas

- **PED-115 (bug):** o status de preparo do pedido fica desatualizado quando o KDS avança itens em paralelo. A correção está na branch PED-82.
- `docs/api-endpoints.md` e `docs/banco-de-dados.md` estão desatualizados em relação ao código.

## 6. Impacto previsto na arquitetura

- O PED-59 adiciona o `helmet` à API.

## 7. Documentos relacionados

`docs/ARQUITETURA.md`, `docs/REQUISITOS.md`, `docs/GITFLOW.md`, `docs/CICD.md` e `docs/adr/`.
