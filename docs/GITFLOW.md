# Fluxo de Git — GitLab Flow

## Branches permanentes

| Branch | Papel                                                                       |
| ------ | --------------------------------------------------------------------------- |
| `main` | Fonte da verdade e ambiente de **homologação** (`api-dev.pedmesa.com.br`)   |
| `prod` | **Produção** (`api.pedmesa.com.br`); só recebe código que já está na `main` |

O código sempre anda da `main` para a `prod`, nunca o contrário.

## Branches de trabalho: uma por épico

- Toda branch sai da `main` mais recente.
- Nome: `PED-<ID-do-épico>-<titulo-do-epico-em-slug>` (minúsculas, hífens, sem acentos). Ex.: `PED-80-delivery-modelagem-de-banco`.
- Todas as tarefas do épico são commitadas nessa branch, **um commit por tarefa**.
- Trabalho sem épico usa um nome descritivo curto, como `organizacao-do-repositorio`.

```bash
git checkout main
git pull
git checkout -b PED-82-delivery-frontend
```

## Commits

Conventional Commits em português, com a chave da tarefa:

```text
<tipo>(<escopo>): [PED-<ID>] <descrição no imperativo>
```

- Tipos: `feat`, `fix`, `refactor`, `chore`, `docs` e `test`.
- No máximo 100 caracteres. O hook `commit-msg` (Commitlint) recusa mensagens fora do padrão, e o job **Commits** do CI confere todos os commits do PR.
- O hook `pre-commit` formata com o Biome os arquivos do stage.
- Exemplo: `feat(delivery): [PED-85] cria tabela de clientes`.

## Pull Request

1. Abra o PR da branch do épico para a `main`.
2. O CI precisa ficar verde (**Qualidade**, **Testes** e **Commits**) e o code owner aprova.
3. Mescle com **squash and merge** quando o épico for uma unidade só, ou com merge comum para manter um commit por tarefa no histórico.
4. Para publicar em produção, abra um PR da `main` para a `prod`.

## Hotfix

Correção urgente segue o fluxo normal: branch a partir da `main`, PR para a `main` e depois `main` → `prod`. Não se commita direto na `prod`.

## Reformatação e branches antigas

A `main` passou a ser formatada pelo Biome. Antes de mesclar uma branch criada antes disso, rode `npm install` e `npm run format` nela e commite o resultado; assim a maior parte dos conflitos de formatação some.
