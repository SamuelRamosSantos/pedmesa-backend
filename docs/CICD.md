# CI/CD — pedmesa-backend

## 1. Visão geral dos workflows

| Arquivo                    | Quando roda                                                  | O que faz                                                                  |
| -------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `.github/workflows/ci.yml` | Pull Request para `main` ou `prod`, `workflow_call` e manual | Jobs **Qualidade**, **Testes** e **Commits**                               |
| `.github/dependabot.yml`   | Agenda do Dependabot                                         | PRs de npm (semanal, minor e patch agrupados) e de GitHub Actions (mensal) |

O CI não roda em `push`: o merge na `main` já passou pelo CI do PR, e um deploy futuro chama o `ci.yml` por `workflow_call`. Isso evita execução duplicada.

### Jobs do `ci.yml`

| Job           | Passos                                                                                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Qualidade** | `npm ci`, `npm run check` (tsc do código e dos testes, Biome com `--error-on-warnings`) e `npm run build`                          |
| **Testes**    | Postgres 16 como serviço (`pedmesa_test`), `npm ci` e `npm test` (unitários e integração; o setup global aplica migrations e seed) |
| **Commits**   | Commitlint em todos os commits do PR (pulado nos PRs do Dependabot)                                                                |

Os nomes dos jobs (**Qualidade**, **Testes** e **Commits**) são os nomes dos checks exigidos na proteção de branch; não os renomeie sem atualizar a proteção.

## 2. Ambientes

| Ambiente    | Branch | Endereço                         | Publicação |
| ----------- | ------ | -------------------------------- | ---------- |
| Homologação | `main` | `https://api-dev.pedmesa.com.br` | Coolify    |
| Produção    | `prod` | `https://api.pedmesa.com.br`     | Coolify    |

O deploy automatizado (imagem no GHCR com tags `<ambiente>`, `latest` e `sha-<commit>`, deploy pelo Coolify e verificação de `/ready`) está planejado na **PED-119**, depois do Dockerfile da **PED-117**. A verificação de cabeçalhos de segurança pós-deploy é a **PED-120**.

## 3. Configuração manual no GitHub

Feita uma vez por repositório, em _Settings_:

1. **Branches → Branch protection rules** para `main` e `prod`:
   - exigir Pull Request antes do merge;
   - exigir os status checks **Qualidade**, **Testes** e **Commits**;
   - exigir revisão dos code owners (`CODEOWNERS`: `* @SamuelRamosSantos`).
2. **Code security:** ativar _Dependabot alerts_ e _Dependabot security updates_.
3. **Environments** (quando o deploy da PED-119 entrar): `homologacao` e `producao`, com _Required reviewers_ em produção. As variáveis de deploy são _Environment variables_ (`vars.*`) e os tokens são _Environment secrets_; um valor cadastrado no lugar errado não é lido pelo workflow.

## 4. `/health` e `/ready`

| Rota          | Responde                                                  | Uso                                       |
| ------------- | --------------------------------------------------------- | ----------------------------------------- |
| `GET /health` | 200 enquanto o processo está de pé; não consulta o banco  | liveness (healthcheck do container)       |
| `GET /ready`  | 200 com `SELECT 1` no banco; 503 se o banco não responder | readiness (fim do deploy e monitoramento) |

## 5. Rodar o CI localmente

```bash
npm ci
npm run check
npm run build
docker compose -f docker-compose.test.yml up -d
npm test
docker compose -f docker-compose.test.yml down
```

## 6. Problemas comuns

- **Testes recusam rodar com `[trava de testes]`:** o `DB_NAME` não termina em `_test`, o `DB_HOST` não é local ou falta o `.env.test`. É proposital; veja o README.
- **Vitest falha com `Cannot read properties of undefined (reading 'config')` no Windows:** o terminal está num caminho com a letra do drive minúscula (`d:/...`, comum no Git Bash). Rode pelo PowerShell ou a partir de `D:\...`.
- **Job Commits falha:** alguma mensagem do PR está fora de `tipo(escopo): [PED-<ID>] descrição` ou passa de 100 caracteres. Corrija com `git commit --amend` (último commit) ou reescrevendo os commits da branch.
- **Job Qualidade falha só no CI:** rode `npm run check` localmente; o hook `pre-commit` só formata os arquivos do stage, não roda o `tsc`.
