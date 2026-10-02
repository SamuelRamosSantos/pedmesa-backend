# ADR-001: Agregado do pedido delivery

- **Status:** Aceito
- **Data:** 2026-09-29
- **Card:** PED-83 (épico PED-80 · Delivery · Modelagem de Banco)
- **Afeta:** PED-84 a PED-113

## Contexto

O PedMesa vai ganhar um módulo de Delivery: pedidos por telefone, com cliente,
endereço, taxa de entrega, troco e um painel de expedição. É preciso decidir onde o
"tipo Delivery" entra no modelo atual.

Hoje o modelo é centrado na mesa:

- **`Comanda` é a unidade que é cobrada.** Pagamentos (`pagamentos_comanda`), desconto
  (`desconto_tipo`, `desconto_valor`), totais (`subtotal`, `total_final`), fechamento
  (`avaliarFechamento`, `ComandaService.fechar`) e todas as métricas do
  `DashboardService` são ancorados na comanda.
- **`Pedido` é um envio para a cozinha dentro de uma comanda.** Uma mesa tem vários
  pedidos ao longo do atendimento. `pedidos.comanda_id` é obrigatório.
- **`pedidos` e `itens_pedido` não têm `tenant_id`.** O isolamento multi-tenant é feito
  por `INNER JOIN` até `comanda.tenant_id` em todas as queries do `PedidoService` e do
  `DashboardService`.
- **`comandas.numero_comanda` é obrigatório**, limitado a `tenant.quantidade_comandas` e
  único entre as comandas abertas (índice parcial `ux_comandas_tenant_numero_aberta`).
  O número também é `NOT NULL` em `fila_impressao` e `logs_exclusao_item` e aparece como
  "mesa" no histórico do dashboard e nos formatters de impressão (inclusive os do
  `pedmesa-print-agent`).

Um pedido delivery, do ponto de vista financeiro, é equivalente a uma **comanda**: é
cobrado uma vez, tem forma de pagamento e é fechado. Do ponto de vista da cozinha, os
itens dele passam pelo mesmo fluxo de preparo (KDS) que os de uma mesa.

## Alternativas consideradas

### A. Discriminador `tipo` em `pedidos`

Adicionar `pedidos.tipo` (`mesa` | `delivery`) e os dados de entrega no próprio pedido.

- ➖ Cria estados inválidos: uma comanda de mesa com um pedido delivery dentro, ou uma
  comanda delivery com vários "envios" de tipos diferentes.
- ➖ O dinheiro continua na comanda. Pagamento, desconto e fechamento teriam de ser
  duplicados no pedido ou ramificados por tipo.
- ➖ Um pedido delivery sem comanda quebraria o isolamento por tenant, que depende do
  join com `comandas`.
- ➕ A mudança parece localizada, mas só na aparência.

### B. Agregado independente (`pedidos_delivery` com itens e pagamentos próprios)

Um modelo paralelo, sem relação com comandas.

- ➕ Não toca no fluxo de mesa.
- ➖ Duplica itens, preparo, KDS, cancelamento de item, pagamento, fechamento,
  impressão e dashboard. Dois caminhos para manter e divergir com o tempo.
- ➖ A cozinha passaria a consultar duas fontes para montar a fila de preparo.

### C. Discriminador na `Comanda` e tabela `entregas` 1:1 (escolhida)

- `comandas.tipo_atendimento` (`mesa` | `delivery`) é a fonte da verdade do tipo. O
  `Pedido` herda o tipo pela relação `pedido.comanda`, que já é carregada em todas as
  queries.
- `entregas` guarda só o que existe no delivery: cliente, snapshot do endereço, taxa,
  forma de pagamento prevista, troco, status de expedição, numeração própria e `versao`
  para concorrência.
- Itens, KDS, cancelamento de item, pagamento, desconto, fechamento, impressão e
  dashboard são reaproveitados, sem cópia.

## Decisão

Adotar a **alternativa C**.

- `comandas.tipo_atendimento` com default `mesa`. As linhas existentes viram `mesa`
  sem backfill manual (PED-84).
- `comandas.numero_comanda` passa a ser nullable, com
  `CHECK (tipo_atendimento = 'delivery' OR numero_comanda IS NOT NULL)`. O banco
  continua proibindo mesa sem número (PED-84).
- O delivery tem numeração própria, `entregas.numero_entrega`, gerada por
  `sequencias_entrega` (PED-88).
- A comanda delivery tem um único integrante, com o nome do cliente, para que o extrato
  e o lançamento de itens funcionem sem ramificação (PED-96).
- As novas tabelas são `clientes`, `enderecos_cliente`, `taxas_entrega`, `entregas`,
  `sequencias_entrega` e `historico_status_entrega`. O modelo está no ER de
  `docs/banco-de-dados.md`.

## Decisões de produto (PO)

| # | Tema | Decisão | Onde se aplica |
|---|---|---|---|
| 1 | Quem cria delivery e opera a Expedição | **Novo papel `EXPEDICAO`**, além do `ADMIN` | PED-113 (criação do papel); PED-96, PED-99, PED-101, PED-110, PED-112 |
| 2 | Base do desconto | **Só sobre os itens.** `total_final = itens − desconto + taxa`; a taxa nunca é descontada | PED-94 |
| 3 | Cancelamento com o pedido em rota | **Não é direto.** Em `em_rota`, registra-se o retorno (`em_rota → pronto_para_envio`, com motivo) e depois cancela. Cancelamento direto só até `pronto_para_envio` | PED-97, PED-100 |
| 4 | Numeração do delivery | **Reinicia todo dia**, por tenant (`#1`, `#2`…) | PED-88 |
| 5 | Taxa de entrega no faturamento | **Conta no faturamento**, com a soma das taxas exposta em campo separado (`taxas_entrega`). Já definido no PED-103 | PED-103 |

## Consequências

### Positivas

- Pagamento, desconto, fechamento, KDS e dashboard funcionam para delivery com
  mudanças pequenas, sem segundo fluxo.
- O isolamento multi-tenant continua pelo mesmo join até `comandas`.
- O banco garante as invariantes: mesa sempre com número (`CHECK`), uma entrega por
  comanda (`UNIQUE` em `entregas.comanda_id`).

### Negativas e custos

- **`numero_comanda` nullable se propaga.** Entidades, mappers, tipos do frontend,
  formatters de impressão (backend e `pedmesa-print-agent`) e o dashboard precisam
  tratar `null`. O Anexo A lista cada ponto.
- **Telas de mesa precisam filtrar por tipo.** Sem filtro, comandas delivery apareceriam
  no Mapa de Mesas, na tela do garçom e na junção de comandas.
- **Transações precisam ser componíveis.** `PedidoService.create` e
  `ComandaService.fechar` abrem as próprias transações. O delivery precisa compô-los numa
  transação só (PED-95).
- **Papel novo `EXPEDICAO`.** Exige migration no enum `usuarios_role_enum`, atualização
  de `UserRole`, `validate-roles`, do cadastro de usuários no frontend, de
  `role-routes.ts` e da tela `SelecionarVisao`. Coberto pelo **PED-113**.

### Lacunas encontradas no backlog (já tratadas)

1. **Junção de comandas (`ComandaService.juntar`)** precisa rejeitar comandas delivery
   (tanto a principal quanto as secundárias). Critério adicionado ao **PED-103**.
2. **Criação do papel `EXPEDICAO`**: card **PED-113** (2 pts, sprint 2), que bloqueia
   PED-96, PED-99, PED-101 e PED-110. Os critérios de RBAC desses cards e do PED-112
   foram atualizados para `ADMIN` e `EXPEDICAO`.

## Anexo A: inventário de código que assume "comanda = mesa"

Levantado na `main` do backend em `b686346`. As linhas podem mudar com o tempo; o
arquivo e o trecho são a referência.

Classificação:

- **ok**: funciona para delivery sem mudança, ou a mudança já está prevista em outro
  card por outro motivo.
- **filtrar por tipo**: precisa considerar `tipo_atendimento` para não misturar mesa e
  delivery.
- **tratar null**: lê ou exibe `numero_comanda`, que passa a ser `null` no delivery.

A coluna "Card" indica onde o comportamento final para delivery é implementado. No
backend, o PED-84 já precisa ajustar os **tipos** de todos os pontos "tratar null",
porque o compilador acusa erro assim que a entidade vira `number | null`. O card listado
entrega o comportamento completo (texto "DELIVERY #7", `identificador`, filtro etc.).

### Backend: entidades, DTOs e migrations

| Local | Uso | Classificação | Card |
|---|---|---|---|
| `comandas/entities/comanda.entity.ts:28-29` | `numeroComanda: number` | tratar null | PED-84 |
| `pedidos/entities/log-exclusao-item.entity.ts:15-16` | `numeroComanda: number` (NOT NULL) | tratar null | PED-103 |
| `impressao/entities/fila-impressao.entity.ts:42-43` | `numeroComanda: number` (NOT NULL) | tratar null | PED-102 |
| `comandas/dtos/create-comanda.dto.ts:23-34` | exige `numero_comanda` | ok (criação de mesa; delivery tem endpoint próprio) | — |
| `comandas/dtos/list-comandas.dto.ts:12-15` | filtro só por `ComandaStatus` | filtrar por tipo (default `mesa`) | PED-103 |
| `migrations/…003-CreateComandasAndIntegrantesTables.ts:79` | índice único parcial `(tenant_id, numero_comanda) WHERE status = 'aberta'` | ok (Postgres aceita vários `NULL` num índice único; confirmar no PED-84) | PED-84 |

### Backend: `ComandaService`

| Local | Uso | Classificação | Card |
|---|---|---|---|
| `create` (`:42-77`) | valida número, limite e unicidade entre abertas | ok (só mesa) | — |
| `list` (`:84-92`) | filtra por `status`, ordena por `numeroComanda` | filtrar por tipo | PED-103 |
| `addIntegrante` (`:94-110`) | checa `ABERTA` | ok | — |
| `getExtrato` (`:112-153`) | busca por id + tenant | ok (taxa entra no PED-94) | PED-94 |
| `addPagamento` / `removePagamento` (`:155-201`) | checa `ABERTA` | ok (reusado no PED-100) | — |
| `atualizarDesconto` (`:203-229`) | checa `ABERTA` | ok (desconto só sobre itens, decisão 2) | PED-94 |
| `juntar` (`:231-275`) | checa `ABERTA` nas comandas | **filtrar por tipo** (rejeitar delivery) | PED-103 |
| `imprimirPreConta` (`:277-316`) | `numero_comanda` no job | tratar null | PED-102 |
| `fechar` (`:319-393`) | checa e grava `FECHADA` | ok (vira componível no PED-95) | PED-95 |
| `cancelarZerada` (`:395-…`) | checa e grava `FECHADA` | ok (reusado no cancelamento, PED-100) | PED-100 |

### Backend: `PedidoService`

| Local | Uso | Classificação | Card |
|---|---|---|---|
| `create` (`:21-121`) | checa `ABERTA`; `numero_comanda` no job da cozinha (`:107`) | tratar null | PED-95, PED-102 |
| `list` (`:128-146`) | `innerJoin("pedido.comanda")`, filtra `ABERTA`, seleciona `numeroComanda` | tratar null (o join de tenant está ok) | PED-103 |
| `updateItemStatus` (`:152-180`) | `innerJoin("pedido.comanda")` para tenant | ok (recebe o hook de sincronização no PED-98) | PED-98 |
| `deleteItem` (`:182-224`) | `innerJoinAndSelect("pedido.comanda")`, checa `ABERTA`, grava `numeroComanda` no log (`:206`) | tratar null | PED-103 |
| `deleteOwnPedido` (`:226-260`) | `innerJoinAndSelect("pedido.comanda")`, checa `ABERTA` | ok | — |

### Backend: mappers

| Local | Uso | Classificação | Card |
|---|---|---|---|
| `comandas/mappers/comanda.mapper.ts:8,16,25,35` | `numero_comanda: number` | tratar null | PED-84 |
| `comandas/mappers/extrato.mapper.ts:8,24` | `numero_comanda: number` | tratar null | PED-84 |
| `pedidos/mappers/pedido.mapper.ts:31,43` | `numero_comanda: number` | tratar null | PED-103 |
| `impressao/mappers/fila-impressao.mapper.ts:8,21` | `numero_comanda: number` | tratar null | PED-102 |

### Backend: impressão

| Local | Uso | Classificação | Card |
|---|---|---|---|
| `impressao/types/print-job.types.ts:14,22` | `numero_comanda: number` | tratar null | PED-102 |
| `impressao/queue/print-queue.ts:21,32,54,105,122,128` | repassa o número; textos "Pré-conta da mesa #…" | tratar null | PED-102 |
| `impressao/formatters/ticket.formatter.ts:14` | `Comanda/Mesa: #…` | tratar null ("DELIVERY #7") | PED-102 |
| `impressao/formatters/preconta.formatter.ts:19` | `Comanda/Mesa: #…` | tratar null | PED-102 |

### Backend: dashboard

| Local | Uso | Classificação | Card |
|---|---|---|---|
| `dashboard/services/dashboard.service.ts:32-50` | faturamento de comandas `FECHADA` | ok (inclui delivery, decisão 5) | PED-103 |
| `dashboard/services/dashboard.service.ts:55-79` | `innerJoin("pedido.comanda")`, `FECHADA` | ok | — |
| `dashboard/services/dashboard.service.ts:81-115` | `mesa: comanda.numeroComanda` (`:112`) | tratar null (`identificador`) | PED-103 |

### `pedmesa-print-agent`

| Local | Uso | Classificação | Card |
|---|---|---|---|
| `src/print/ticket-formatter.js:18` | `Comanda/Mesa: #…` | tratar null | PED-102 |
| `src/print/preconta-formatter.js:23` | `Comanda/Mesa: #…` | tratar null | PED-102 |
| `src/queue/poller.js:63,71` | repassa `numero_comanda` | tratar null | PED-102 |
| `src/main.js:139` | página de teste com `numero_comanda: 0` | ok | — |

### Frontend

| Local | Uso | Classificação | Card |
|---|---|---|---|
| `types/comanda.ts:23,31,79`, `services/comanda.service.ts:15` | `numero_comanda: number` | tratar null (tipo `number \| null`) | PED-105 |
| `types/pedido.ts:24`, `pages/cozinha/types.ts:13` | `numero_comanda: number` | tratar null | PED-105, PED-112 |
| `types/dashboard.ts:13` | `mesa: number` | tratar null (`identificador`) | PED-103, PED-112 |
| `pages/cozinha/Kds.tsx:68`, `cozinha/components/GrupoPreparoCard.tsx:45` | exibe o número da mesa | tratar null (badge "DELIVERY #7") | PED-112 |
| `pages/admin/DashboardProprietario.tsx:267` | `Mesa {linha.mesa}` | tratar null | PED-112 |
| `pages/caixa/MapaMesas.tsx:66`, `pages/garcom/Mesas.tsx:46`, `garcom/components/ComandaCard.tsx:24`, `caixa/components/JuntarComandasModal.tsx:99,124` | listas de mesas | ok, **desde que** o backend filtre por tipo | PED-103 |
| `pages/garcom/ComandaDetalhe.tsx:250,281,338,565`, `pages/caixa/ComandaFechamento.tsx:305,491`, `pages/caixa/PreContaImpressao.tsx:89` | "Mesa {número}" em telas abertas por id | ok (delivery não navega para essas telas; por URL direta mostraria "Mesa null", risco baixo) | — |
| `pages/garcom/components/NovaComandaModal.tsx` | cria comanda de mesa | ok | — |
